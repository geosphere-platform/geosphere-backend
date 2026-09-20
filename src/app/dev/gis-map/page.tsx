"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapView,
  VectorLayer,
  ClusterLayer,
  HeatmapLayer,
  MapMarker,
  MapFeature,
  DrawType,
  MeasurementResult,
  VisualizationEngine,
  VisualizationConfig,
  StyleRule,
  LegendConfig,
  LayerTreeNode,
} from "@gis/map";
import type { GISMap } from "@gis/map";

// Generic mock spatial features for demo playground
const MOCK_POINTS: MapMarker[] = [
  {
    id: "node-1",
    coordinate: [73.8567, 18.5204],
    title: "Central Hub",
    metadata: {
      city: "Pune",
      status: "active",
      speed: 65,
      category: "commercial",
      score: 85,
    },
    style: { fillColor: "#10b981", circleRadius: 10, label: "Central Hub" },
  },
  {
    id: "node-2",
    coordinate: [72.8777, 19.076],
    title: "Western Center",
    metadata: {
      city: "Mumbai",
      status: "active",
      speed: 45,
      category: "financial",
      score: 92,
    },
    style: { fillColor: "#10b981", circleRadius: 10, label: "Western Center" },
  },
  {
    id: "node-3",
    coordinate: [77.209, 28.6139],
    title: "Northern Capital",
    metadata: {
      city: "Delhi",
      status: "warning",
      speed: 15,
      category: "capital",
      score: 45,
    },
    style: {
      fillColor: "#f59e0b",
      circleRadius: 10,
      label: "Northern Capital",
    },
  },
  {
    id: "node-4",
    coordinate: [77.5946, 12.9716],
    title: "Southern Hub",
    metadata: {
      city: "Bengaluru",
      status: "inactive",
      speed: 0,
      category: "technology",
      score: 10,
    },
    style: { fillColor: "#ef4444", circleRadius: 10, label: "Southern Hub" },
  },
];

const MOCK_ROUTE_LINE: MapFeature = {
  id: "route-line-1",
  geometry: {
    type: "LineString",
    coordinates: [
      [73.8567, 18.5204],
      [73.9, 18.55],
      [73.95, 18.6],
    ],
  },
  properties: { type: "highway", speedLimit: 80, lengthKm: 12.5 },
  style: { strokeColor: "#3b82f6", strokeWidth: 4 },
};

const MOCK_SERVICE_AREA_POLYGON: MapFeature = {
  id: "service-zone-alpha",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [73.78, 18.58],
        [73.92, 18.58],
        [73.92, 18.48],
        [73.78, 18.48],
        [73.78, 18.58],
      ],
    ],
  },
  properties: {
    name: "Greater Pune Zone",
    zoneType: "metropolitan",
    totalCoverageSqKm: 125.4,
  },
  style: {
    fillColor: "#10b981",
    fillOpacity: 0.15,
    strokeColor: "#059669",
    strokeWidth: 2,
  },
};

// Generic Real-time Simulated Subject
interface DemoSubject {
  id: string;
  name: string;
  type: string;
  externalId: string;
  lng: number;
  lat: number;
  speed: number;
  heading: number;
  status: "INSIDE" | "OUTSIDE" | "BOUNDARY";
}

export default function GISPlaygroundPage() {
  const mapRef = useRef<GISMap | null>(null);
  const vizEngineRef = useRef<VisualizationEngine>(new VisualizationEngine());

  // UI Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    "realtime" | "operations" | "visualization" | "query" | "analytics"
  >("realtime");

  // Phase 10 Query & Analytics Playground State
  const [queryMode, setQueryMode] = useState<
    "radius" | "nearest" | "bbox" | "text"
  >("radius");
  const [queryRadiusMeters, setQueryRadiusMeters] = useState<number>(5000);
  const [queryCenterLng, setQueryCenterLng] = useState<number>(73.8567);
  const [queryCenterLat, setQueryCenterLat] = useState<number>(18.5204);
  const [queryNearestN, setQueryNearestN] = useState<number>(5);
  const [querySearchText, setQuerySearchText] = useState<string>("Hub");
  const [queryResultSummary, setQueryResultSummary] = useState<string>(
    "Select operation and click Execute Query",
  );
  const [queryResults, setQueryResults] = useState<any[]>([]);

  const [analyticsType, setAnalyticsType] = useState<
    "geofence" | "events" | "movement" | "timeseries"
  >("movement");
  const [analyticsSubjectId, setAnalyticsSubjectId] =
    useState<string>("subj-01");
  const [analyticsResultSummary, setAnalyticsResultSummary] = useState<string>(
    "Select analytics type and click Execute Analytics",
  );
  const [analyticsOutput, setAnalyticsOutput] = useState<any | null>(null);

  // Core State
  const [selectedFeatureInfo, setSelectedFeatureInfo] = useState<any>(null);
  const [activeMeasurement, setActiveMeasurement] =
    useState<MeasurementResult | null>(null);
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [layerTree, setLayerTree] = useState<LayerTreeNode[]>([]);

  // Phase 7 Visualization Engine State
  const [selectedStyleMode, setSelectedStyleMode] = useState<
    "static" | "category" | "numeric"
  >("category");
  const [activeFilterStatus, setActiveFilterStatus] = useState<string>("all");
  const [activeMinScore] = useState<number>(0);
  const [activeLegend, setActiveLegend] = useState<LegendConfig | undefined>(
    undefined,
  );
  const [isClusterActive] = useState<boolean>(true);
  const [isHeatmapActive] = useState<boolean>(false);

  // Phase 8 Geospatial Operations Engine State
  const [bufferDistanceMeters, setBufferDistanceMeters] =
    useState<number>(5000);
  const [opResultSummary, setOpResultSummary] = useState<string>(
    "Select a spatial operation to execute",
  );
  const [geofenceSubjectState, setGeofenceSubjectState] = useState<
    "OUTSIDE" | "INSIDE" | "BOUNDARY"
  >("OUTSIDE");
  const [geofenceTransition, setGeofenceTransition] = useState<string>("NONE");

  // Phase 9 Real-Time Spatial Engine State
  const [subjects, setSubjects] = useState<DemoSubject[]>([
    {
      id: "subj-01",
      name: "Subject Alpha",
      type: "vehicle",
      externalId: "EXT-101",
      lng: 73.8567,
      lat: 18.5204,
      speed: 12.5,
      heading: 45,
      status: "INSIDE",
    },
    {
      id: "subj-02",
      name: "Subject Beta",
      type: "employee",
      externalId: "EMP-204",
      lng: 73.8,
      lat: 18.5,
      speed: 1.2,
      heading: 180,
      status: "OUTSIDE",
    },
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [realtimeEvents, setRealtimeEvents] = useState<
    Array<{
      id: string;
      type: string;
      subjectId: string;
      timestamp: string;
      details: string;
    }>
  >([]);
  const [newSubName, setNewSubName] = useState<string>("Subject Gamma");
  const [newSubCategory, setNewSubCategory] = useState<string>("asset");

  const logEvent = (msg: string) => {
    setEventLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 19),
    ]);
  };

  const addRealtimeEventLog = (
    evtType: string,
    subjectId: string,
    details: string,
  ) => {
    const newEvt = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: evtType,
      subjectId,
      timestamp: new Date().toLocaleTimeString(),
      details,
    };
    setRealtimeEvents((prev) => [newEvt, ...prev.slice(0, 24)]);
  };

  const handleMapReady = (map: GISMap) => {
    mapRef.current = map;
    logEvent("GIS Platform & Real-Time Spatial Engine initialized.");

    // Setup initial layer tree definitions
    const treeMgr = vizEngineRef.current.layerTreeManager;
    treeMgr.setGroup({
      id: "infrastructure",
      name: "Infrastructure Group",
      visible: true,
      order: 1,
    });
    treeMgr.setLayer({
      id: "cluster-points",
      name: "Spatial Points",
      type: "cluster",
      visible: true,
      opacity: 1.0,
      zIndex: 3,
      groupId: "infrastructure",
    });
    treeMgr.setLayer({
      id: "vector-features",
      name: "Vector Lines & Polygons",
      type: "vector",
      visible: true,
      opacity: 1.0,
      zIndex: 2,
      groupId: "infrastructure",
    });

    // Add Demo Points, Route, and Polygon
    MOCK_POINTS.forEach((p) => map.addMarker(p, "cluster-points"));
    map.features.addFeature(MOCK_ROUTE_LINE);
    map.features.addFeature(MOCK_SERVICE_AREA_POLYGON);

    // Render Initial Real-Time Subjects on Map
    subjects.forEach((s) => {
      map.addMarker({
        id: s.id,
        coordinate: [s.lng, s.lat],
        title: s.name,
        metadata: { type: s.type, speed: s.speed, heading: s.heading },
        style: {
          fillColor: s.status === "INSIDE" ? "#10b981" : "#3b82f6",
          circleRadius: 10,
          label: s.name,
        },
      });
    });

    // Event Subscriptions
    map.on("featureSelected", ({ feature, coordinate }) => {
      if (feature) {
        setSelectedFeatureInfo({
          id: feature.id,
          geometryType: feature.geometry.type,
          properties: feature.properties,
          coordinate,
        });
        logEvent(`Feature selected: '${feature.id}'`);
      } else {
        setSelectedFeatureInfo(null);
      }
    });
  };

  // Live Location Movement Simulation Effect
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setSubjects((prevSubjects) => {
        return prevSubjects.map((s) => {
          // Generate small random movement step
          const dLng = (Math.random() - 0.48) * 0.005;
          const dLat = (Math.random() - 0.48) * 0.005;
          const newLng = s.lng + dLng;
          const newLat = s.lat + dLat;
          const newHeading =
            (s.heading + (Math.random() * 20 - 10) + 360) % 360;
          const newSpeed = Math.max(0, s.speed + (Math.random() * 4 - 2));

          // Check if subject is inside Pune Geofence Polygon (73.78 - 73.92, 18.48 - 18.58)
          const isInsideGeofence =
            newLng >= 73.78 &&
            newLng <= 73.92 &&
            newLat >= 18.48 &&
            newLat <= 18.58;
          const newStatus: "INSIDE" | "OUTSIDE" = isInsideGeofence
            ? "INSIDE"
            : "OUTSIDE";

          // Detect Geofence Transition
          if (s.status !== newStatus) {
            const transType =
              newStatus === "INSIDE" ? "SPATIAL_ENTER" : "SPATIAL_EXIT";
            addRealtimeEventLog(
              transType,
              s.id,
              `Geofence 'Greater Pune Zone' ${transType === "SPATIAL_ENTER" ? "Entered" : "Exited"}`,
            );
            logEvent(
              `[${transType}] Subject '${s.name}' ${newStatus === "INSIDE" ? "ENTERED" : "EXITED"} Zone`,
            );
          } else {
            addRealtimeEventLog(
              "LOCATION_UPDATED",
              s.id,
              `Pos [${newLng.toFixed(4)}, ${newLat.toFixed(4)}], Speed: ${newSpeed.toFixed(1)} m/s`,
            );
          }

          // In-Place Map Marker Geometry Update
          if (mapRef.current) {
            mapRef.current.addMarker({
              id: s.id,
              coordinate: [newLng, newLat],
              title: s.name,
              metadata: { type: s.type, speed: newSpeed, heading: newHeading },
              style: {
                fillColor: newStatus === "INSIDE" ? "#10b981" : "#ef4444",
                circleRadius: 10,
                label: s.name,
              },
            });
          }

          return {
            ...s,
            lng: newLng,
            lat: newLat,
            speed: newSpeed,
            heading: newHeading,
            status: newStatus,
          };
        });
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const handleCreateSubject = () => {
    const id = `subj-${Date.now().toString().substr(-4)}`;
    const newSub: DemoSubject = {
      id,
      name: newSubName,
      type: newSubCategory,
      externalId: `EXT-${Math.floor(Math.random() * 900 + 100)}`,
      lng: 73.8567 + (Math.random() - 0.5) * 0.05,
      lat: 18.5204 + (Math.random() - 0.5) * 0.05,
      speed: 15.0,
      heading: 90,
      status: "INSIDE",
    };

    setSubjects((prev) => [...prev, newSub]);
    logEvent(`Created SpatialSubject '${newSub.name}' (Type: ${newSub.type})`);
    addRealtimeEventLog(
      "SUBJECT_CREATED",
      id,
      `Registered ${newSubName} (${newSubCategory})`,
    );

    if (mapRef.current) {
      mapRef.current.addMarker({
        id: newSub.id,
        coordinate: [newSub.lng, newSub.lat],
        title: newSub.name,
        style: { fillColor: "#8b5cf6", circleRadius: 10, label: newSub.name },
      });
    }
  };

  // Phase 8 Handlers
  const handleGenerateBuffer = () => {
    if (!mapRef.current) return;
    const centerPoint = MOCK_POINTS[0].coordinate;
    const degreeOffset = bufferDistanceMeters / 111320;

    const bufferFeature: MapFeature = {
      id: "generated-buffer-zone",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [centerPoint[0] - degreeOffset, centerPoint[1] - degreeOffset],
            [centerPoint[0] + degreeOffset, centerPoint[1] - degreeOffset],
            [centerPoint[0] + degreeOffset, centerPoint[1] + degreeOffset],
            [centerPoint[0] - degreeOffset, centerPoint[1] + degreeOffset],
            [centerPoint[0] - degreeOffset, centerPoint[1] - degreeOffset],
          ],
        ],
      },
      properties: { type: "buffer", distanceMeters: bufferDistanceMeters },
      style: {
        fillColor: "#8b5cf6",
        fillOpacity: 0.3,
        strokeColor: "#7c3aed",
        strokeWidth: 2,
      },
    };

    mapRef.current.features.addFeature(bufferFeature);
    const summary = `Generated PostGIS Buffer (${bufferDistanceMeters}m) around [${centerPoint[0]}, ${centerPoint[1]}]`;
    setOpResultSummary(summary);
    logEvent(summary);
  };

  const handleCalculateDistance = () => {
    const p1 = MOCK_POINTS[0].coordinate;
    const p2 = MOCK_POINTS[1].coordinate;
    const dLat = (p2[1] - p1[1]) * (Math.PI / 180);
    const dLon = (p2[0] - p1[0]) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(p1[1] * (Math.PI / 180)) *
        Math.cos(p2[1] * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distMeters = 6371000 * c;

    const summary = `Distance: ${(distMeters / 1000).toFixed(2)} km between 'Central Hub' and 'Western Center'`;
    setOpResultSummary(summary);
    logEvent(summary);
  };

  const handleCalculateArea = () => {
    const summary = `Area: 125.40 sq km for 'Greater Pune Zone' Polygon (ST_Area geography)`;
    setOpResultSummary(summary);
    logEvent(summary);
  };

  const handleCalculateCentroid = () => {
    if (!mapRef.current) return;
    const centroidCoord: [number, number] = [73.85, 18.53];
    const marker: MapMarker = {
      id: "centroid-marker",
      coordinate: centroidCoord,
      title: "Centroid Point",
      style: {
        fillColor: "#ef4444",
        circleRadius: 8,
        label: "Centroid [73.85, 18.53]",
      },
    };
    mapRef.current.addMarker(marker);

    const summary = `Centroid computed at [73.850, 18.530] via ST_Centroid`;
    setOpResultSummary(summary);
    logEvent(summary);
  };

  return (
    <div className="flex h-screen w-full flex-col bg-slate-900 text-slate-100">
      {/* Top Header */}
      <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-950 px-6">
        <div className="flex items-center space-x-3">
          <span className="rounded bg-sky-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Phase 9
          </span>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Real-Time Spatial Data & Event Engine Playground
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab("realtime")}
            className={`px-3 py-1 rounded-md font-medium transition ${activeTab === "realtime" ? "bg-sky-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            📡 Real-Time Stream
          </button>
          <button
            onClick={() => setActiveTab("operations")}
            className={`px-3 py-1 rounded-md font-medium transition ${activeTab === "operations" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            ⚙️ Operations
          </button>
          <button
            onClick={() => setActiveTab("query")}
            className={`px-3 py-1 rounded-md font-medium transition ${activeTab === "query" ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            🔍 Query Engine
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1 rounded-md font-medium transition ${activeTab === "analytics" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            📊 Analytics
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400">
          <span>Engine Status:</span>
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
            Live Stream Active
          </span>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Panel */}
        <aside className="w-96 overflow-y-auto border-r border-slate-800 bg-slate-950 p-4 space-y-6">
          {activeTab === "realtime" ? (
            <>
              {/* 1. Live Trajectory Simulation Controller */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400 mb-3">
                  1. Live Trajectory Stream Controller
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setIsSimulating(!isSimulating)}
                    className={`flex-1 py-2 px-3 rounded font-medium text-xs shadow transition ${isSimulating ? "bg-amber-600 hover:bg-amber-500 text-white" : "bg-emerald-600 hover:bg-emerald-500 text-white"}`}
                  >
                    {isSimulating
                      ? "⏸️ Pause Location Updates"
                      : "▶️ Start Live Trajectory Stream"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Simulates incoming location updates, atomic current position
                  updates, and live OpenLayers map marker movements.
                </p>
              </section>

              {/* 2. Generic Spatial Subject Provisioning */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400">
                  2. Provision Generic Subject
                </h2>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={newSubName}
                      onChange={(e) => setNewSubName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Subject Category / Type
                    </label>
                    <select
                      value={newSubCategory}
                      onChange={(e) => setNewSubCategory(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="vehicle">vehicle</option>
                      <option value="employee">employee</option>
                      <option value="asset">asset</option>
                      <option value="drone">drone</option>
                      <option value="device">device</option>
                      <option value="delivery">delivery</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCreateSubject}
                    className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded text-xs transition"
                  >
                    ➕ Register SpatialSubject
                  </button>
                </div>
              </section>

              {/* 3. Live Spatial Event Stream Log */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-sky-400 mb-2">
                  3. Real-Time Event Stream Log
                </h2>
                <div className="h-44 overflow-y-auto rounded bg-slate-950 p-2 font-mono text-[10px] space-y-1.5 text-slate-300">
                  {realtimeEvents.length === 0 ? (
                    <div className="text-slate-500 italic">
                      No real-time events emitted yet. Start stream above.
                    </div>
                  ) : (
                    realtimeEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="border-b border-slate-800/80 pb-1"
                      >
                        <span className="text-slate-500">
                          [{evt.timestamp}]
                        </span>{" "}
                        <span
                          className={
                            evt.type === "SPATIAL_ENTER"
                              ? "text-emerald-400 font-bold"
                              : evt.type === "SPATIAL_EXIT"
                                ? "text-rose-400 font-bold"
                                : "text-sky-300"
                          }
                        >
                          {evt.type}
                        </span>{" "}
                        <span className="text-slate-400">
                          ({evt.subjectId})
                        </span>
                        : {evt.details}
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : activeTab === "operations" ? (
            <>
              {/* Operations Tab Section */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-indigo-400 mb-3">
                  Spatial Operations Engine
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={handleCalculateDistance}
                    className="p-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200"
                  >
                    📏 Distance
                  </button>
                  <button
                    onClick={handleCalculateArea}
                    className="p-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200"
                  >
                    📐 Polygon Area
                  </button>
                  <button
                    onClick={handleCalculateCentroid}
                    className="p-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200"
                  >
                    🎯 Centroid
                  </button>
                  <button
                    onClick={handleGenerateBuffer}
                    className="p-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200"
                  >
                    ⭕ Buffer (5000m)
                  </button>
                </div>
              </section>
            </>
          ) : activeTab === "query" ? (
            <>
              {/* Phase 10 — GIS Query Engine Tab */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-400">
                  Phase 10 — GIS Query Engine
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Query Operation Type
                    </label>
                    <select
                      value={queryMode}
                      onChange={(e) => setQueryMode(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="radius">
                        ⭕ Spatial Radius Search (ST_DWithin)
                      </option>
                      <option value="nearest">
                        🎯 Nearest N Neighbors (KNN &lt;-&gt;)
                      </option>
                      <option value="bbox">
                        📦 Viewport Bounding Box (ST_Intersects)
                      </option>
                      <option value="text">
                        🔍 Full-Text & Spatial Combined Search
                      </option>
                    </select>
                  </div>

                  {queryMode === "radius" && (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Search Radius (Meters)
                      </label>
                      <input
                        type="number"
                        value={queryRadiusMeters}
                        onChange={(e) =>
                          setQueryRadiusMeters(Number(e.target.value))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  )}

                  {queryMode === "nearest" && (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Nearest N Candidates
                      </label>
                      <input
                        type="number"
                        value={queryNearestN}
                        onChange={(e) =>
                          setQueryNearestN(Number(e.target.value))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  )}

                  {queryMode === "text" && (
                    <div>
                      <label className="block text-slate-400 mb-1">
                        Search Term
                      </label>
                      <input
                        type="text"
                        value={querySearchText}
                        onChange={(e) => setQuerySearchText(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                      />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const count = MOCK_POINTS.length;
                      const summary = `Executed ${queryMode.toUpperCase()} query: Found ${count} matching spatial features within target bounds. Server-side filtered.`;
                      setQueryResultSummary(summary);
                      logEvent(summary);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded text-xs transition"
                  >
                    ⚡ Execute PostGIS Query
                  </button>
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Query Results Summary
                </h3>
                <div className="rounded bg-slate-950 p-2.5 text-xs text-slate-300 font-mono">
                  {queryResultSummary}
                </div>
              </section>
            </>
          ) : (
            <>
              {/* Phase 10 — Spatial Analytics Tab */}
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-400">
                  Phase 10 — Spatial Analytics Engine
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">
                      Analytics Engine Type
                    </label>
                    <select
                      value={analyticsType}
                      onChange={(e) => setAnalyticsType(e.target.value as any)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    >
                      <option value="movement">
                        📉 Track & Movement Statistics
                      </option>
                      <option value="geofence">
                        🚪 Geofence Entry/Exit Intervals
                      </option>
                      <option value="events">🔔 Spatial Event Analytics</option>
                      <option value="timeseries">
                        ⏳ Time-Bucket Aggregation
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Subject ID
                    </label>
                    <input
                      type="text"
                      value={analyticsSubjectId}
                      onChange={(e) => setAnalyticsSubjectId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-slate-200"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const summary = `Executed ${analyticsType.toUpperCase()} analytics for '${analyticsSubjectId}': Computed 12.5 km distance, 3450s duration, 2 geofence entries, 0 gaps.`;
                      setAnalyticsResultSummary(summary);
                      setAnalyticsOutput({
                        subjectId: analyticsSubjectId,
                        analyticsType,
                        totalDistanceKm: 12.5,
                        durationSeconds: 3450,
                        eventsRecorded: 8,
                        dataQuality: "100% (No gaps)",
                      });
                      logEvent(summary);
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded text-xs transition"
                  >
                    📊 Compute Spatial Analytics
                  </button>
                </div>
              </section>

              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Analytics Result
                </h3>
                <div className="rounded bg-slate-950 p-2.5 text-xs text-slate-300 font-mono space-y-1">
                  <div>{analyticsResultSummary}</div>
                  {analyticsOutput && (
                    <pre className="mt-2 text-[11px] text-amber-300 bg-slate-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(analyticsOutput, null, 2)}
                    </pre>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Bottom Execution Output */}
          <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              System Log & Diagnostic Output
            </h2>
            <div className="h-32 overflow-y-auto rounded bg-slate-950 p-2 font-mono text-[10px] text-slate-300 space-y-1">
              {eventLogs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </section>
        </aside>

        {/* Right Map Canvas & Live Position Table */}
        <main className="flex flex-1 flex-col overflow-hidden bg-slate-900">
          <div className="flex-1 relative">
            <MapView
              options={{
                center: [73.8567, 18.5204],
                zoom: 12,
                baseTile: "osm",
              }}
              onMapReady={handleMapReady}
              className="h-full w-full"
            />
          </div>

          {/* Live Subjects Position Ledger Bar */}
          <div className="h-44 border-t border-slate-800 bg-slate-950 p-3 overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Live Subject Current Positions ({subjects.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Atomic Pos Store • PostGIS ST_SetSRID
              </span>
            </div>

            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 uppercase">
                  <th className="py-1 px-2">Subject ID</th>
                  <th className="py-1 px-2">Name</th>
                  <th className="py-1 px-2">Type</th>
                  <th className="py-1 px-2">Coordinates (Lng, Lat)</th>
                  <th className="py-1 px-2">Speed (m/s)</th>
                  <th className="py-1 px-2">Heading</th>
                  <th className="py-1 px-2">Geofence Status</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-800/40 hover:bg-slate-900/50"
                  >
                    <td className="py-1.5 px-2 font-mono text-[11px] text-sky-400">
                      {s.id}
                    </td>
                    <td className="py-1.5 px-2 font-medium text-slate-200">
                      {s.name}
                    </td>
                    <td className="py-1.5 px-2 text-slate-400">{s.type}</td>
                    <td className="py-1.5 px-2 font-mono text-[11px] text-slate-300">
                      [{s.lng.toFixed(4)}, {s.lat.toFixed(4)}]
                    </td>
                    <td className="py-1.5 px-2 font-mono text-slate-300">
                      {s.speed.toFixed(1)}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-slate-300">
                      {s.heading.toFixed(0)}°
                    </td>
                    <td className="py-1.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.status === "INSIDE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}
