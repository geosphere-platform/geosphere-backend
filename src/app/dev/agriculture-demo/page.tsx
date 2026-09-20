"use client";

import React, { useState, useEffect } from "react";
import {
  GISProvider,
  useMap,
  useLayers,
  useSpatialQuery,
  useGeofences,
} from "@gis-sdk/react";

// Host Application Domain Types (Agriculture Specific)
interface FarmField {
  id: string;
  fieldName: string;
  cropType: "Corn" | "Wheat" | "Soybean" | "Cotton";
  areaHectares: number;
  soilMoisturePercent: number;
}

const agSDKConfig = {
  apiBaseUrl:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3500",
  organizationId: "org_agri_corp",
  workspaceId: "ws_midwest_farms",
  accessToken: "jwt_token_agri_app",
};

function AgricultureAppUI() {
  const map = useMap("agri-map", { center: [-93.6091, 41.6005], zoom: 12 });
  const layers = useLayers(map);
  const spatial = useSpatialQuery();
  const { geofence } = useGeofences();

  // Host Business Logic State
  const [fields, setFields] = useState<FarmField[]>([
    {
      id: "FIELD-01",
      fieldName: "North Valley Parcel A",
      cropType: "Corn",
      areaHectares: 45.2,
      soilMoisturePercent: 32,
    },
    {
      id: "FIELD-02",
      fieldName: "East Meadow Ridge",
      cropType: "Wheat",
      areaHectares: 28.5,
      soilMoisturePercent: 27,
    },
  ]);

  const handleCreateFieldGeofence = async (field: FarmField) => {
    try {
      await geofence.createGeofence({
        name: `Field Geofence: ${field.fieldName}`,
        type: "polygon",
        metadata: { cropType: field.cropType, hectares: field.areaHectares },
      });
      alert(
        `Geofence registered for crop parcel "${field.fieldName}" via @gis-sdk/geofence`,
      );
    } catch {
      alert(`Simulated Geofence created for crop field "${field.fieldName}"`);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-100 bg-slate-900 min-h-screen font-sans">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <span className="px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold uppercase">
            Example Application B
          </span>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">
            Precision Agriculture & Crop Field System
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Domain application defining{" "}
            <code className="text-emerald-300">Farm</code>,{" "}
            <code className="text-emerald-300">Field</code>,{" "}
            <code className="text-emerald-300">Crop</code> consuming generic{" "}
            <code className="text-indigo-300">@gis-sdk/*</code>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl">
          <h2 className="text-base font-semibold text-slate-200 mb-3">
            Crop Boundary & Spatial Analytics View
          </h2>
          <div
            id="agri-map"
            className="w-full h-[480px] bg-slate-950 rounded-lg overflow-hidden border border-slate-800"
          />
        </div>

        <div className="bg-slate-800/80 rounded-xl border border-slate-700/60 p-4 shadow-xl space-y-4">
          <h2 className="text-base font-semibold text-slate-200">
            Managed Fields ({fields.length})
          </h2>
          <div className="space-y-3">
            {fields.map((f) => (
              <div
                key={f.id}
                className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/60 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-100">
                    {f.fieldName}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {f.cropType}
                  </span>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <div>
                    Area:{" "}
                    <span className="text-slate-200 font-semibold">
                      {f.areaHectares} Hectares
                    </span>
                  </div>
                  <div>
                    Soil Moisture:{" "}
                    <span className="text-blue-400 font-semibold">
                      {f.soilMoisturePercent}%
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleCreateFieldGeofence(f)}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded transition"
                >
                  Register Field Geofence Boundary
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgricultureDemoPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-300 p-8 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="text-sm font-medium">
            Mounting Agriculture Application Demo...
          </p>
        </div>
      </div>
    );
  }

  return (
    <GISProvider config={agSDKConfig}>
      <AgricultureAppUI />
    </GISProvider>
  );
}
