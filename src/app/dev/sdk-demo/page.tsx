"use client";

import React, { useState, useEffect } from "react";
import {
  GISProvider,
  useGIS,
  useMap,
  useLayers,
  useTracking,
  useGeofences,
  useRealtime,
  useEntitlements,
  useSpatialQuery,
} from "@gis-sdk/react";

const sdkConfig = {
  apiBaseUrl:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3500",
  organizationId: "org_demo_phase14",
  workspaceId: "ws_demo_phase14",
  accessToken: "demo_jwt_token_sdk",
  environment: "development" as const,
};

function SDKPlaygroundUI() {
  const { sdk, isReady } = useGIS();
  const map = useMap("playground-map", {
    center: [73.8567, 18.5204],
    zoom: 12,
  });
  const layers = useLayers(map);
  const { tracking, updates } = useTracking();
  const { geofences, refresh: refreshGeofences } = useGeofences();
  const { connectionState, events } = useRealtime("workspace_alerts");
  const { checkFeature, features } = useEntitlements();
  const spatial = useSpatialQuery();

  const [simulatedLat, setSimulatedLat] = useState(18.5204);
  const [simulatedLng, setSimulatedLng] = useState(73.8567);
  const [activeTab, setActiveTab] = useState<
    "layers" | "tracking" | "geofences" | "realtime" | "spatial"
  >("layers");

  const handleSimulateUpdate = () => {
    const nextLat = simulatedLat + (Math.random() - 0.5) * 0.005;
    const nextLng = simulatedLng + (Math.random() - 0.5) * 0.005;
    setSimulatedLat(nextLat);
    setSimulatedLng(nextLng);

    tracking.sendLocationUpdate({
      entityId: "ENTITY_DEMO_01",
      latitude: nextLat,
      longitude: nextLng,
      timestamp: new Date().toISOString(),
      speed: Math.round(Math.random() * 60),
      heading: 90,
    });
  };

  const handleAddSampleLayer = () => {
    if (!layers) return;
    layers.createLayer({
      id: `layer-${Date.now()}`,
      name: `Sample Layer ${layers.listLayers().length + 1}`,
      type: "vector",
      visible: true,
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-900 min-h-screen font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Phase 14 — GIS SDK Interactive Playground
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Testing <code className="text-blue-300">@gis-sdk/core</code>,{" "}
            <code className="text-blue-300">@gis-sdk/map</code>,{" "}
            <code className="text-blue-300">@gis-sdk/tracking</code>,{" "}
            <code className="text-blue-300">@gis-sdk/geofence</code>,{" "}
            <code className="text-blue-300">@gis-sdk/realtime</code>, and{" "}
            <code className="text-blue-300">@gis-sdk/react</code>.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${isReady ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-yellow-500/20 text-yellow-400"}`}
          >
            SDK State: {isReady ? "READY" : "INITIALIZING"}
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            Realtime: {connectionState}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map View Container */}
        <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-200">
              Interactive Map View (`@gis-sdk/map`)
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleAddSampleLayer}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition"
              >
                + Add Vector Layer
              </button>
              <button
                onClick={handleSimulateUpdate}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition"
              >
                Transmit Entity Location
              </button>
            </div>
          </div>

          <div
            id="playground-map"
            className="w-full h-[500px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800 relative"
          >
            {!map && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                Initializing OpenLayers Map Adapter...
              </div>
            )}
          </div>
        </div>

        {/* SDK Controls & Sub-System Status */}
        <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl flex flex-col space-y-4">
          <div className="flex border-b border-slate-700 pb-2 space-x-2 overflow-x-auto">
            {(
              [
                "layers",
                "tracking",
                "geofences",
                "realtime",
                "spatial",
              ] as const
            ).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition ${
                  activeTab === tab
                    ? "bg-indigo-600 text-white shadow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px] text-xs space-y-3">
            {activeTab === "layers" && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">
                  Active Layers ({layers?.listLayers().length || 0})
                </h3>
                {layers?.listLayers().map((l) => (
                  <div
                    key={l.id}
                    className="p-2.5 bg-slate-900/60 rounded border border-slate-700/50 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium text-indigo-300">
                        {l.name}
                      </span>
                      <span className="ml-2 text-slate-500 text-[10px]">
                        ({l.type})
                      </span>
                    </div>
                    <button
                      onClick={() => layers.removeLayer(l.id)}
                      className="text-red-400 hover:text-red-300 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "tracking" && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">
                  Tracking Updates ({updates.length})
                </h3>
                {updates.slice(0, 8).map((u, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-slate-900/60 rounded border border-slate-700/50 space-y-1"
                  >
                    <div className="flex justify-between font-mono text-[11px] text-emerald-400">
                      <span>{u.entityId}</span>
                      <span>{u.speed} km/h</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Lat: {u.latitude.toFixed(4)}, Lng:{" "}
                      {u.longitude.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "geofences" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-slate-300">Geofences</h3>
                  <button
                    onClick={refreshGeofences}
                    className="text-xs text-indigo-400 hover:underline"
                  >
                    Refresh
                  </button>
                </div>
                {geofences.length === 0 ? (
                  <p className="text-slate-500">No active geofences loaded.</p>
                ) : (
                  geofences.map((g) => (
                    <div
                      key={g.id}
                      className="p-2 bg-slate-900/60 rounded border border-slate-700/50"
                    >
                      <div className="font-medium text-slate-200">{g.name}</div>
                      <div className="text-slate-400 text-[10px]">
                        Type: {g.type}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "realtime" && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-300">
                  Realtime Events ({events.length})
                </h3>
                {events.length === 0 ? (
                  <p className="text-slate-500">
                    Listening on channel &apos;workspace_alerts&apos;...
                  </p>
                ) : (
                  events.map((e, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-900/60 rounded border border-slate-700/50"
                    >
                      <div className="text-indigo-400 font-mono">{e.type}</div>
                      <div className="text-slate-400 text-[10px]">
                        {e.timestamp}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "spatial" && (
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-300">
                  Spatial Query Testing
                </h3>
                <button
                  onClick={async () => {
                    const res = await spatial.nearby(
                      { latitude: 18.5204, longitude: 73.8567 },
                      1000,
                    );
                    alert(`Spatial Query Result: ${JSON.stringify(res)}`);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium text-xs transition"
                >
                  Execute Nearby Query (1000m)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SDKDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 p-8 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          <p className="text-sm font-medium">
            Mounting GIS SDK Interactive Playground...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GISProvider config={sdkConfig}>
      <SDKPlaygroundUI />
    </GISProvider>
  );
}
