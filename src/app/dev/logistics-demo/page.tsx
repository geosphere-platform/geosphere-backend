"use client";

import React, { useState, useEffect } from "react";
import {
  GISProvider,
  useMap,
  useLayers,
  useTracking,
  useGeofences,
} from "@gis-sdk/react";

// Host Application Domain Types (Logistics Specific)
interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  status: "IN_TRANSIT" | "IDLE" | "DELIVERED";
  currentLocation: { lat: number; lng: number };
}

const logisticsSDKConfig = {
  apiBaseUrl:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3500",
  organizationId: "org_logistics_enterprise",
  workspaceId: "ws_fleet_north_america",
  accessToken: "jwt_token_logistics_app",
};

function LogisticsAppUI() {
  const map = useMap("logistics-map", { center: [-74.006, 40.7128], zoom: 11 });
  const layers = useLayers(map);
  const { tracking } = useTracking();
  const { geofences } = useGeofences();

  // Host Business Logic State
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    {
      id: "VEH-101",
      plateNumber: "NY-8821-X",
      driverName: "John Doe",
      status: "IN_TRANSIT",
      currentLocation: { lat: 40.7128, lng: -74.006 },
    },
    {
      id: "VEH-102",
      plateNumber: "NJ-4412-Z",
      driverName: "Alice Smith",
      status: "IDLE",
      currentLocation: { lat: 40.7306, lng: -73.9352 },
    },
  ]);

  const handleSimulateDispatch = (vehicleId: string) => {
    const updated = vehicles.map((v) => {
      if (v.id === vehicleId) {
        const nextLat = v.currentLocation.lat + (Math.random() - 0.5) * 0.01;
        const nextLng = v.currentLocation.lng + (Math.random() - 0.5) * 0.01;

        // Transmit via generic SDK
        tracking.sendLocationUpdate({
          entityId: v.id,
          latitude: nextLat,
          longitude: nextLng,
          timestamp: new Date().toISOString(),
          speed: 45,
          metadata: { plateNumber: v.plateNumber },
        });

        return {
          ...v,
          status: "IN_TRANSIT" as const,
          currentLocation: { lat: nextLat, lng: nextLng },
        };
      }
      return v;
    });
    setVehicles(updated);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-900 min-h-screen font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <span className="px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-semibold uppercase">
            Example Application A
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Global Logistics & Fleet Management System
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Domain application defining{" "}
            <code className="text-indigo-300">Vehicle</code>,{" "}
            <code className="text-indigo-300">Driver</code>,{" "}
            <code className="text-indigo-300">Shipment</code> consuming generic{" "}
            <code className="text-emerald-300">@gis-sdk/*</code>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl">
          <h2 className="text-base font-semibold text-slate-200 mb-3">
            Live Fleet Tracking View
          </h2>
          <div
            id="logistics-map"
            className="w-full h-[480px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800"
          />
        </div>

        <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-slate-200">
            Active Fleet Vehicles ({vehicles.length})
          </h2>
          <div className="space-y-3">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-100">{v.id}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${v.status === "IN_TRANSIT" ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-300"}`}
                  >
                    {v.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>
                    Driver:{" "}
                    <span className="text-slate-200">{v.driverName}</span>
                  </div>
                  <div>
                    Plate:{" "}
                    <span className="font-mono text-slate-300">
                      {v.plateNumber}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSimulateDispatch(v.id)}
                  className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition"
                >
                  Transmit Location Update
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogisticsDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 p-8 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-sm font-medium">
            Mounting Logistics Application Demo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GISProvider config={logisticsSDKConfig}>
      <LogisticsAppUI />
    </GISProvider>
  );
}
