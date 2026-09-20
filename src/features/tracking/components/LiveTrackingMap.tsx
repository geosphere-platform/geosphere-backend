"use client";

import React, { useEffect, useRef, useCallback } from "react";
import {
  GISMap,
  MapMarker,
  VectorLayer,
  MapFeature,
} from "@gis/map";
import { LiveTrackingEntity, UserLiveLocation, DEFAULT_INDIA_CENTER } from "../types";
import { TrackingGeofenceZone } from "../mock/trackingMockData";
import { getDirectionArrow } from "../mock/nagpurRoutes";

interface LiveTrackingMapProps {
  entities: LiveTrackingEntity[];
  selectedEntity: LiveTrackingEntity | null;
  userLocation: UserLiveLocation;
  geofences: TrackingGeofenceZone[];
  showBreadcrumbs: boolean;
  showGeofences: boolean;
  followSelected: boolean;
  activeBasemap: "street" | "dark" | "satellite";
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onSelectEntity: (id: string) => void;
  onToggleFollow: () => void;
  onChangeBasemap: (basemap: "street" | "dark" | "satellite") => void;
  onRequestUserLocation?: () => void;
}

export const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  entities,
  selectedEntity,
  userLocation,
  geofences,
  showBreadcrumbs,
  showGeofences,
  followSelected,
  activeBasemap,
  isFullScreen = false,
  onToggleFullScreen,
  onSelectEntity,
  onToggleFollow,
  onChangeBasemap,
  onRequestUserLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const gisMapRef = useRef<GISMap | null>(null);
  const prevFollowCoordsRef = useRef<[number, number] | null>(null);

  // Initialize OpenLayers Map SDK with Default Region = India
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center is India (Nagpur Zero Mile Hub)
    const initialCenter: [number, number] = [
      DEFAULT_INDIA_CENTER.longitude,
      DEFAULT_INDIA_CENTER.latitude,
    ];

    const gisMap = new GISMap({
      center: initialCenter,
      zoom: 12,
      baseTile: activeBasemap === "satellite" ? "satellite" : activeBasemap === "dark" ? "carto_dark" : "osm",
      controls: {
        zoom: false,
        fullscreen: false,
        scale: true,
        attribution: false,
      },
    });

    gisMapRef.current = gisMap;
    gisMap.initialize(mapContainerRef.current);

    // 1. Geofences vector layer
    const geofenceLayer = new VectorLayer({
      id: "tracking-geofences-layer",
      name: "Geofence Zones",
      visible: true,
      zIndex: 2,
    });
    gisMap.layers.addLayer(geofenceLayer);

    // 2. Breadcrumbs polyline layer
    const breadcrumbLayer = new VectorLayer({
      id: "tracking-breadcrumbs-layer",
      name: "Breadcrumb Trails",
      visible: true,
      zIndex: 3,
    });
    gisMap.layers.addLayer(breadcrumbLayer);

    // 3. Vehicles marker layer
    const vehiclesLayer = new VectorLayer({
      id: "tracking-vehicles-layer",
      name: "Vehicles",
      visible: true,
      zIndex: 5,
    });
    gisMap.layers.addLayer(vehiclesLayer);

    // 4. Dedicated User Live Location Layer (highest z-index)
    const userLocationLayer = new VectorLayer({
      id: "user-live-location-layer",
      name: "My Live Location",
      visible: true,
      zIndex: 10,
    });
    gisMap.layers.addLayer(userLocationLayer);

    // Feature click / selection listener
    gisMap.on("featureSelected", ({ feature }) => {
      if (feature && feature.properties?.entityId) {
        onSelectEntity(String(feature.properties.entityId));
      }
    });

    return () => {
      gisMap.destroy();
      gisMapRef.current = null;
    };
  }, []);

  // Update Basemap Provider
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;
    if (activeBasemap === "satellite") {
      gisMap.setBaseTile("satellite");
    } else if (activeBasemap === "dark") {
      gisMap.setBaseTile("carto_dark");
    } else {
      gisMap.setBaseTile("osm");
    }
  }, [activeBasemap]);

  // Render User Live Location on Map Every Time Coordinates Update
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;

    // Clear previous user position marker
    gisMap.features.removeFeature("marker-user-live-location");
    gisMap.features.removeFeature("buffer-user-accuracy-ring");

    const userMarker: MapMarker = {
      id: "marker-user-live-location",
      coordinate: [userLocation.longitude, userLocation.latitude],
      title: userLocation.isRealGps ? "📍 Your Current Live GPS Location" : "📍 Default User Location (India)",
      metadata: {
        isUserLocation: true,
        accuracy: userLocation.accuracyMeters,
        timestamp: userLocation.timestamp,
      },
      style: {
        circleRadius: 12,
        fillColor: "#2563eb", // Vibrant royal blue
        strokeColor: "#ffffff",
        strokeWidth: 3.5,
        label: userLocation.isRealGps ? "📍 You Are Here" : "📍 You (India Hub)",
        labelColor: "#93c5fd",
        labelFont: "bold 11px sans-serif",
      },
    };

    gisMap.addMarker(userMarker, "user-live-location-layer");
  }, [userLocation]);

  // Render Geofences on Map
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;

    // Clear old geofence features
    geofences.forEach((g) => gisMap.features.removeFeature(`geofence-${g.id}`));

    if (!showGeofences) return;

    geofences.forEach((g) => {
      const feature: MapFeature = {
        id: `geofence-${g.id}`,
        geometry: {
          type: "Polygon",
          coordinates: [g.coordinates],
        },
        properties: {
          geofenceId: g.id,
          name: g.name,
          category: g.category,
        },
        style: {
          fillColor: `${g.color}26`, // 15% opacity
          strokeColor: g.color,
          strokeWidth: 2,
          strokeDashArray: [4, 4],
          label: g.name,
          labelColor: "#f8fafc",
          labelFont: "11px sans-serif",
        },
      };

      try {
        gisMap.features.addFeature(feature);
      } catch {
        // Feature might exist
      }
    });
  }, [geofences, showGeofences]);

  // Render Breadcrumb Trails for Selected Entity
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;

    // Remove previous breadcrumb lines
    entities.forEach((e) => gisMap.features.removeFeature(`trail-${e.id}`));

    if (!showBreadcrumbs || !selectedEntity || selectedEntity.breadcrumbTrail.length < 2) {
      return;
    }

    const trailCoords: [number, number][] = selectedEntity.breadcrumbTrail.map((p) => [
      p.longitude,
      p.latitude,
    ]);

    const trailFeature: MapFeature = {
      id: `trail-${selectedEntity.id}`,
      geometry: {
        type: "LineString",
        coordinates: trailCoords,
      },
      properties: {
        entityId: selectedEntity.id,
        pointCount: trailCoords.length,
      },
      style: {
        strokeColor: "#38bdf8", // Sky blue glowing trail
        strokeWidth: 4,
        strokeDashArray: [6, 4],
      },
    };

    try {
      gisMap.features.addFeature(trailFeature);
    } catch {
      // Ignore if already present
    }
  }, [selectedEntity, showBreadcrumbs, entities]);

  // Render Vehicle Markers with Heading Rotations & Status Colors
  useEffect(() => {
    if (!gisMapRef.current) return;
    const gisMap = gisMapRef.current;

    // Clear previous vehicle markers
    entities.forEach((e) => gisMap.features.removeFeature(`marker-${e.id}`));

    entities.forEach((v) => {
      const isSelected = selectedEntity?.id === v.id;
      const isMoving = v.status === "moving";
      const isIdle = v.status === "idle";
      const isOverspeed = v.overspeedAlert;

      const fillColor = isOverspeed
        ? "#ef4444"
        : isMoving
          ? "#10b981"
          : isIdle
            ? "#f59e0b"
            : "#64748b";

      const arrow = getDirectionArrow(v.heading);
      const speedKmh = Math.round(v.speed);
      const statusText = v.status === "offline" ? "OFFLINE" : `${speedKmh} km/h`;
      const displayLabel = `${arrow} ${v.licensePlate} (${statusText})`;

      const marker: MapMarker = {
        id: `marker-${v.id}`,
        coordinate: [v.longitude, v.latitude],
        title: `${v.licensePlate} • ${v.name} • Status: ${v.status.toUpperCase()} • Speed: ${speedKmh} km/h • Heading: ${v.heading}° ${arrow} • Updated: ${v.lastUpdated}`,
        metadata: {
          entityId: v.id,
          name: v.name,
          licensePlate: v.licensePlate,
          status: v.status,
          heading: v.heading,
          speed: v.speed,
          lastUpdated: v.lastUpdated,
        },
        style: {
          circleRadius: isSelected ? 13 : 10,
          fillColor: fillColor,
          strokeColor: isSelected ? "#38bdf8" : "#ffffff",
          strokeWidth: isSelected ? 3.5 : 2,
          label: displayLabel,
          labelColor: "#f1f5f9",
          labelFont: "bold 10px sans-serif",
        },
      };

      gisMap.addMarker(marker, "tracking-vehicles-layer");
    });
  }, [entities, selectedEntity]);

  // Auto-Follow Camera Logic
  useEffect(() => {
    if (!followSelected || !selectedEntity || !gisMapRef.current) return;

    const currentCoords: [number, number] = [
      selectedEntity.longitude,
      selectedEntity.latitude,
    ];

    const prev = prevFollowCoordsRef.current;
    const hasMoved = !prev || Math.abs(prev[0] - currentCoords[0]) > 0.00005 || Math.abs(prev[1] - currentCoords[1]) > 0.00005;

    if (hasMoved) {
      prevFollowCoordsRef.current = currentCoords;
      gisMapRef.current.viewport.setCenter(currentCoords, true);
    }
  }, [followSelected, selectedEntity?.latitude, selectedEntity?.longitude]);

  // Fit bounds to all vehicles
  const handleFitAll = useCallback(() => {
    if (!gisMapRef.current || entities.length === 0) return;
    const lons = entities.map((e) => e.longitude);
    const lats = entities.map((e) => e.latitude);

    const minLon = Math.min(...lons) - 0.01;
    const maxLon = Math.max(...lons) + 0.01;
    const minLat = Math.min(...lats) - 0.01;
    const maxLat = Math.max(...lats) + 0.01;

    gisMapRef.current.viewport.fitExtent([minLon, minLat, maxLon, maxLat], 40);
  }, [entities]);

  // Center on User's Current Live Location
  const handleCenterUserLocation = useCallback(() => {
    if (!gisMapRef.current) return;
    if (onRequestUserLocation) {
      onRequestUserLocation();
    }
    gisMapRef.current.viewport.setCenter(
      [userLocation.longitude, userLocation.latitude],
      true,
    );
    gisMapRef.current.viewport.setZoom(15, true);
  }, [userLocation, onRequestUserLocation]);

  // Reset to Default India Hub Region
  const handleResetToIndia = useCallback(() => {
    if (!gisMapRef.current) return;
    gisMapRef.current.viewport.setCenter(
      [DEFAULT_INDIA_CENTER.longitude, DEFAULT_INDIA_CENTER.latitude],
      true,
    );
    gisMapRef.current.viewport.setZoom(DEFAULT_INDIA_CENTER.zoom, true);
  }, []);

  // Center on Selected Entity
  const handleCenterSelected = useCallback(() => {
    if (!gisMapRef.current || !selectedEntity) return;
    gisMapRef.current.viewport.setCenter(
      [selectedEntity.longitude, selectedEntity.latitude],
      true,
    );
    gisMapRef.current.viewport.setZoom(15, true);
  }, [selectedEntity]);

  // Continuous resize recalculation on fullscreen toggle
  useEffect(() => {
    if (!gisMapRef.current) return;
    const timers = [
      setTimeout(() => gisMapRef.current?.resize(), 30),
      setTimeout(() => gisMapRef.current?.resize(), 150),
      setTimeout(() => gisMapRef.current?.resize(), 400),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isFullScreen]);

  return (
    <div
      className={
        isFullScreen
          ? "relative w-full h-full rounded-none overflow-hidden bg-slate-950"
          : "relative w-full h-[680px] rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950"
      }
    >
      {/* OpenLayers Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Floating Basemap & Location Controls Toolbar */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/80 shadow-lg text-xs font-semibold">
        {/* Street Basemap */}
        <button
          type="button"
          onClick={() => onChangeBasemap("street")}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${
            activeBasemap === "street"
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          Street
        </button>

        {/* Dark Canvas */}
        <button
          type="button"
          onClick={() => onChangeBasemap("dark")}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${
            activeBasemap === "dark"
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          Dark
        </button>

        {/* Satellite Imagery */}
        <button
          type="button"
          onClick={() => onChangeBasemap("satellite")}
          className={`px-2.5 py-1.5 rounded-lg transition-colors ${
            activeBasemap === "satellite"
              ? "bg-blue-600 text-white"
              : "text-slate-300 hover:text-white hover:bg-slate-800"
          }`}
        >
          Satellite
        </button>

        <div className="w-[1px] h-4 bg-slate-700 mx-1" />

        {/* Center on My Live Location Button */}
        <button
          type="button"
          onClick={handleCenterUserLocation}
          title="Zoom to your current live location"
          className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <span>My Location</span>
        </button>

        {/* Reset View to India Default Region */}
        <button
          type="button"
          onClick={handleResetToIndia}
          title="Reset map view to Default Region (India Hub)"
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors flex items-center gap-1"
        >
          <span>🇮🇳 India Hub</span>
        </button>

        {/* Fit All Fleet Vehicles Button */}
        <button
          type="button"
          onClick={handleFitAll}
          title="Fit all fleet vehicles in view"
          className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
          Fit Fleet
        </button>

        {/* Focus Selected Button */}
        {selectedEntity && (
          <button
            type="button"
            onClick={handleCenterSelected}
            title={`Focus on ${selectedEntity.licensePlate}`}
            className="px-2.5 py-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Focus ({selectedEntity.licensePlate})
          </button>
        )}

        {/* Fullscreen Map Toggle Button */}
        {onToggleFullScreen && (
          <button
            type="button"
            onClick={onToggleFullScreen}
            title={isFullScreen ? "Exit Fullscreen Map (Esc)" : "Expand to Fullscreen Map"}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 font-bold ${
              isFullScreen
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:text-white"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isFullScreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            <span>{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
          </button>
        )}
      </div>

      {/* Map Zoom Controls */}
      <div className="absolute bottom-6 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg text-white">
        <button
          type="button"
          onClick={() => gisMapRef.current?.setZoom((gisMapRef.current?.getZoom() || 12) + 1)}
          className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center font-bold text-sm"
          title="Zoom In"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => gisMapRef.current?.setZoom((gisMapRef.current?.getZoom() || 12) - 1)}
          className="w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center font-bold text-sm"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Map Legend Pill with User Location */}
      <div className="absolute bottom-6 left-4 z-10 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/80 text-[11px] text-slate-300 shadow-lg">
        <span className="font-bold text-slate-400">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-300/40" />
          <span className="font-bold text-blue-300">You Are Here</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Moving</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Idle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Offline</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Overspeed</span>
        </div>
      </div>
    </div>
  );
};
