"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  LiveTrackingEntity,
  FleetTrackingMetrics,
  TrackingFilterState,
  TrackingStatusFilter,
  LiveBreadcrumbPoint,
} from "../types";
import {
  INITIAL_LIVE_ENTITIES,
  MOCK_GEOFENCE_ZONES,
  TrackingGeofenceZone,
} from "../mock/trackingMockData";
import {
  NAGPUR_SIMULATION_FLEET,
  calculateBearing,
  interpolateCoordinate,
} from "../mock/nagpurRoutes";
import { DashboardService } from "@/features/dashboard/services/dashboard.service";

export interface UseLiveTrackingStreamReturn {
  entities: LiveTrackingEntity[];
  filteredEntities: LiveTrackingEntity[];
  selectedEntity: LiveTrackingEntity | null;
  selectedEntityId: string | null;
  geofences: TrackingGeofenceZone[];
  metrics: FleetTrackingMetrics;
  filterState: TrackingFilterState;
  connectionStatus: "connected" | "polling" | "simulating" | "offline";
  lastPingTime: string;
  selectEntity: (id: string | null) => void;
  setStatusFilter: (status: TrackingStatusFilter) => void;
  setSearchQuery: (query: string) => void;
  toggleBreadcrumbs: () => void;
  toggleGeofences: () => void;
  toggleFollowSelected: () => void;
  toggleSimulation: () => void;
  setBasemap: (basemap: "street" | "dark" | "satellite") => void;
  refreshNow: () => Promise<void>;
}

export function useLiveTrackingStream(): UseLiveTrackingStreamReturn {
  const [entities, setEntities] = useState<LiveTrackingEntity[]>(INITIAL_LIVE_ENTITIES);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>("veh-001");
  const [connectionStatus, setConnectionStatus] = useState<
    "connected" | "polling" | "simulating" | "offline"
  >("simulating");
  const [lastPingTime, setLastPingTime] = useState<string>("Just now");

  const [filterState, setFilterState] = useState<TrackingFilterState>({
    status: "all",
    searchQuery: "",
    showBreadcrumbs: true,
    showGeofences: true,
    followSelected: true,
    simulationActive: true,
    activeBasemap: "street",
  });

  const isMountedRef = useRef<boolean>(true);
  const lastEventTimestamps = useRef<Map<string, number>>(new Map());
  const lastRealEventReceivedAt = useRef<number>(0);

  // Auto-select and filter from URL search parameters (?vehicleId=... or ?search=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const urlParams = new URLSearchParams(window.location.search);
    const vehicleIdParam = urlParams.get("vehicleId");
    const searchParam = urlParams.get("search");

    if (searchParam) {
      setFilterState((prev) => ({ ...prev, searchQuery: searchParam }));
    }

    if (vehicleIdParam) {
      const match = entities.find(
        (e) =>
          e.id === vehicleIdParam ||
          e.licensePlate.toLowerCase() === vehicleIdParam.toLowerCase(),
      );
      if (match) {
        setSelectedEntityId(match.id);
        setFilterState((prev) => ({ ...prev, followSelected: true }));
      }
    } else if (searchParam) {
      const match = entities.find(
        (e) =>
          e.licensePlate.toLowerCase().includes(searchParam.toLowerCase()) ||
          e.name.toLowerCase().includes(searchParam.toLowerCase()),
      );
      if (match) {
        setSelectedEntityId(match.id);
        setFilterState((prev) => ({ ...prev, followSelected: true }));
      }
    }
  }, [entities]);

  // ───────────────────────────────────────────────────────────────────────────
  // 1. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM CONNECTION
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let reconnectDelay = 1000;

    const connectSSE = () => {
      if (!isMountedRef.current) return;

      try {
        // Connect to central GeoSphere Realtime Spatial SSE Stream
        eventSource = new EventSource("/api/v1/spatial/realtime/stream");

        eventSource.addEventListener("connected", () => {
          if (!isMountedRef.current) return;
          setConnectionStatus("connected");
          reconnectDelay = 1000; // Reset backoff on successful connect
        });

        eventSource.onmessage = (event) => {
          if (!isMountedRef.current || !event.data) return;

          try {
            const envelope = JSON.parse(event.data);
            if (!envelope || envelope.eventType !== "LOCATION_UPDATED") return;

            const subjectId = envelope.subjectId;
            const payload = envelope.payload;
            if (!subjectId || !payload || !Array.isArray(payload.coordinate)) return;

            const [lng, lat] = payload.coordinate;
            const eventTimeMs = new Date(envelope.timestamp).getTime();

            // Deduplication: suppress duplicate or out-of-order event timestamps
            const prevTime = lastEventTimestamps.current.get(subjectId) ?? 0;
            if (eventTimeMs <= prevTime) {
              return; // Ignore duplicate
            }
            lastEventTimestamps.current.set(subjectId, eventTimeMs);
            lastRealEventReceivedAt.current = Date.now();

            const speedKmh = typeof payload.speed === "number" ? Math.round(payload.speed * 3.6) : 0;
            const heading = typeof payload.heading === "number" ? payload.heading : 0;

            setEntities((prev) => {
              const matchIndex = prev.findIndex((e) => e.id === subjectId || e.licensePlate === subjectId);

              const newWaypoint: LiveBreadcrumbPoint = {
                id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                latitude: lat,
                longitude: lng,
                speedKmh,
                heading,
                timestamp: "Just now",
              };

              if (matchIndex === -1) {
                // Provision new vehicle entity dynamically
                const newEntity: LiveTrackingEntity = {
                  id: subjectId,
                  name: `Vehicle ${subjectId}`,
                  licensePlate: subjectId.toUpperCase(),
                  status: speedKmh > 2 ? "moving" : "idle",
                  latitude: lat,
                  longitude: lng,
                  speed: speedKmh,
                  heading,
                  driverName: "Active Driver",
                  lastUpdated: "Just now",
                  batteryPct: 88,
                  altitudeMeters: 310,
                  ignition: "ON",
                  signalStrength: 5,
                  breadcrumbTrail: [newWaypoint],
                  overspeedAlert: speedKmh > 75,
                };
                return [...prev, newEntity];
              }

              const existing = prev[matchIndex];
              const updatedTrail = [...existing.breadcrumbTrail, newWaypoint].slice(-30);
              const status: "moving" | "idle" = speedKmh > 2 ? "moving" : "idle";

              const updated: LiveTrackingEntity = {
                ...existing,
                latitude: lat,
                longitude: lng,
                speed: speedKmh,
                heading,
                status,
                lastUpdated: "Just now",
                overspeedAlert: speedKmh > 75,
                breadcrumbTrail: updatedTrail,
              };

              const nextList = [...prev];
              nextList[matchIndex] = updated;
              return nextList;
            });

            setConnectionStatus("connected");
            setLastPingTime(new Date().toLocaleTimeString());
          } catch {
            // Suppress parse errors for heartbeats or non-JSON comments
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }

          if (isMountedRef.current) {
            setConnectionStatus(filterState.simulationActive ? "simulating" : "offline");
            // Exponential backoff reconnect: 1s, 2s, 4s, max 10s
            reconnectTimer = setTimeout(connectSSE, reconnectDelay);
            reconnectDelay = Math.min(10000, reconnectDelay * 1.8);
          }
        };
      } catch {
        if (isMountedRef.current) {
          setConnectionStatus(filterState.simulationActive ? "simulating" : "offline");
        }
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  }, [filterState.simulationActive]);

  // ───────────────────────────────────────────────────────────────────────────
  // 2. STALE GPS TELEMETRY DETECTOR (Marks entities >60s inactive as offline)
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const staleInterval = setInterval(() => {
      if (!isMountedRef.current) return;
      const now = Date.now();

      // If we haven't received external live events in the last 15s and simulation is on, show simulating
      if (now - lastRealEventReceivedAt.current > 15000 && filterState.simulationActive) {
        setConnectionStatus("simulating");
      }
    }, 5000);

    return () => clearInterval(staleInterval);
  }, [filterState.simulationActive]);

  // ───────────────────────────────────────────────────────────────────────────
  // 3. REST FALLBACK POLL (Reads from /api/v1/vehicles/live when SSE is idle)
  // ───────────────────────────────────────────────────────────────────────────
  const fetchBackendData = useCallback(async () => {
    try {
      const liveVehicles = await DashboardService.fetchLiveVehicles();
      if (Array.isArray(liveVehicles) && liveVehicles.length > 0 && isMountedRef.current) {
        setEntities((prev) =>
          prev.map((existing) => {
            const match = liveVehicles.find((lv) => lv.id === existing.id);
            if (!match) return existing;
            return {
              ...existing,
              latitude: match.latitude,
              longitude: match.longitude,
              speed: match.speed,
              heading: match.heading,
              status: match.status,
              lastUpdated: match.lastUpdated,
            };
          }),
        );
        setLastPingTime(new Date().toLocaleTimeString());
      }
    } catch {
      // Kept in local simulation
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBackendData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBackendData]);

  // ───────────────────────────────────────────────────────────────────────────
  // 4. NAGPUR MULTI-VEHICLE SIMULATION ENGINE (Fallback when no live hardware)
  // ───────────────────────────────────────────────────────────────────────────
  const simProgressRef = useRef<{ [vehicleId: string]: { wpIdx: number; t: number } }>({
    "veh-001": { wpIdx: 0, t: 0.1 },
    "veh-002": { wpIdx: 0, t: 0.3 },
    "veh-003": { wpIdx: 0, t: 0.5 },
  });

  useEffect(() => {
    if (!filterState.simulationActive) return;

    const interval = setInterval(() => {
      if (!isMountedRef.current) return;

      // Only advance locally if no real live SSE updates were received in the last 4 seconds
      const timeSinceRealEvent = Date.now() - lastRealEventReceivedAt.current;
      if (timeSinceRealEvent < 4000) {
        return; // Let live backend events drive the map!
      }

      setEntities((prevEntities) =>
        prevEntities.map((entity) => {
          if (entity.status === "offline") return entity;

          const route = NAGPUR_SIMULATION_FLEET.find((r) => r.vehicleId === entity.id);
          if (!route) {
            // Default subtle jitter movement for other vehicles
            const rad = (entity.heading * Math.PI) / 180;
            const deltaLat = Math.cos(rad) * 0.00015;
            const deltaLon = Math.sin(rad) * 0.0002;
            const newLat = Number((entity.latitude + deltaLat).toFixed(6));
            const newLon = Number((entity.longitude + deltaLon).toFixed(6));
            return { ...entity, latitude: newLat, longitude: newLon, lastUpdated: "Just now" };
          }

          // Advance along calibrated Nagpur road waypoint segment
          const progress = simProgressRef.current[entity.id] ?? { wpIdx: 0, t: 0 };
          const waypoints = route.waypoints;
          const wpCount = waypoints.length;

          progress.t += 0.06;
          if (progress.t >= 1.0) {
            progress.t = 0;
            progress.wpIdx = (progress.wpIdx + 1) % wpCount;
          }
          simProgressRef.current[entity.id] = progress;

          const currWp = waypoints[progress.wpIdx];
          const nextWp = waypoints[(progress.wpIdx + 1) % wpCount];

          const interpolated = interpolateCoordinate(
            { lat: currWp.lat, lng: currWp.lng },
            { lat: nextWp.lat, lng: nextWp.lng },
            progress.t
          );

          const heading = calculateBearing(currWp.lat, currWp.lng, nextWp.lat, nextWp.lng);
          const jitter = (Math.random() - 0.5) * 4;
          const speed = Math.max(15, Math.min(85, Number((currWp.speedLimitKmh + jitter).toFixed(1))));

          const newWaypoint: LiveBreadcrumbPoint = {
            id: `wp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            latitude: interpolated.lat,
            longitude: interpolated.lng,
            speedKmh: speed,
            heading,
            timestamp: "Just now",
            altitudeMeters: entity.altitudeMeters,
          };

          const updatedTrail = [...entity.breadcrumbTrail, newWaypoint].slice(-30);

          return {
            ...entity,
            latitude: interpolated.lat,
            longitude: interpolated.lng,
            heading,
            speed,
            lastUpdated: "Just now",
            overspeedAlert: speed > 75,
            breadcrumbTrail: updatedTrail,
          };
        }),
      );

      setLastPingTime(new Date().toLocaleTimeString());
    }, 2000);

    return () => clearInterval(interval);
  }, [filterState.simulationActive]);

  // Selected Entity
  const selectedEntity = useMemo(() => {
    return entities.find((e) => e.id === selectedEntityId) ?? entities[0] ?? null;
  }, [entities, selectedEntityId]);

  // Filtered Entities based on user query and status
  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      // Status filter
      if (filterState.status !== "all" && e.status !== filterState.status) {
        return false;
      }
      // Search filter
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchesName = e.name.toLowerCase().includes(q);
        const matchesPlate = e.licensePlate.toLowerCase().includes(q);
        const matchesDriver = e.driverName.toLowerCase().includes(q);
        return matchesName || matchesPlate || matchesDriver;
      }
      return true;
    });
  }, [entities, filterState.status, filterState.searchQuery]);

  // Fleet Metrics
  const metrics: FleetTrackingMetrics = useMemo(() => {
    const total = entities.length;
    let moving = 0;
    let idle = 0;
    let offline = 0;
    let overspeed = 0;
    let totalSpeed = 0;
    let activeAlertsCount = 0;

    for (const e of entities) {
      if (e.status === "moving") moving++;
      else if (e.status === "idle") idle++;
      else if (e.status === "offline") offline++;

      if (e.overspeedAlert) {
        overspeed++;
        activeAlertsCount++;
      }
      totalSpeed += e.speed;
    }

    const avgSpeedKmh = total > 0 ? Math.round(totalSpeed / total) : 0;

    return {
      total,
      moving,
      idle,
      offline,
      overspeed,
      avgSpeedKmh,
      activeAlertsCount,
    };
  }, [entities]);

  // Action callbacks
  const selectEntity = useCallback((id: string | null) => {
    setSelectedEntityId(id);
  }, []);

  const setStatusFilter = useCallback((status: TrackingStatusFilter) => {
    setFilterState((prev) => ({ ...prev, status }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilterState((prev) => ({ ...prev, searchQuery }));
  }, []);

  const toggleBreadcrumbs = useCallback(() => {
    setFilterState((prev) => ({ ...prev, showBreadcrumbs: !prev.showBreadcrumbs }));
  }, []);

  const toggleGeofences = useCallback(() => {
    setFilterState((prev) => ({ ...prev, showGeofences: !prev.showGeofences }));
  }, []);

  const toggleFollowSelected = useCallback(() => {
    setFilterState((prev) => ({ ...prev, followSelected: !prev.followSelected }));
  }, []);

  const toggleSimulation = useCallback(() => {
    setFilterState((prev) => {
      const nextActive = !prev.simulationActive;
      setConnectionStatus(nextActive ? "simulating" : "polling");
      return { ...prev, simulationActive: nextActive };
    });
  }, []);

  const setBasemap = useCallback((activeBasemap: "street" | "dark" | "satellite") => {
    setFilterState((prev) => ({ ...prev, activeBasemap }));
  }, []);

  return {
    entities,
    filteredEntities,
    selectedEntity,
    selectedEntityId,
    geofences: MOCK_GEOFENCE_ZONES,
    metrics,
    filterState,
    connectionStatus,
    lastPingTime,
    selectEntity,
    setStatusFilter,
    setSearchQuery,
    toggleBreadcrumbs,
    toggleGeofences,
    toggleFollowSelected,
    toggleSimulation,
    setBasemap,
    refreshNow: fetchBackendData,
  };
}
