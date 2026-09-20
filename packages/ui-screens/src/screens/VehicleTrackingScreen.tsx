import React, { useState } from "react";

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  speedKmh: number;
  status: "MOVING" | "IDLE" | "OFFLINE";
  batteryPct: number;
  latitude: number;
  longitude: number;
}

export interface VehicleTrackingScreenProps {
  vehicles?: Vehicle[];
  onVehicleSelect?: (vehicle: Vehicle) => void;
  onRefresh?: () => void;
}

export const VehicleTrackingScreen: React.FC<VehicleTrackingScreenProps> = ({
  vehicles = [
    { id: "v1", plateNumber: "MH-31-FA-1001", driverName: "Alex Rivera", speedKmh: 42, status: "MOVING", batteryPct: 88, latitude: 21.1458, longitude: 79.0882 },
    { id: "v2", plateNumber: "MH-31-FA-2002", driverName: "Sarah Chen", speedKmh: 0, status: "IDLE", batteryPct: 95, latitude: 21.1550, longitude: 79.0950 },
    { id: "v3", plateNumber: "MH-31-FA-3003", driverName: "Devon Vance", speedKmh: 0, status: "OFFLINE", batteryPct: 45, latitude: 21.1300, longitude: 79.0700 },
  ],
  onVehicleSelect,
  onRefresh,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (v: Vehicle) => {
    setSelectedId(v.id);
    if (onVehicleSelect) onVehicleSelect(v);
  };

  return (
    <div style={{ padding: "16px", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "12px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#38bdf8" }}>Vehicle Fleet Tracking Screen</h2>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>Real-time location, speed, and telemetry status</p>
        </div>
        <button
          onClick={onRefresh}
          style={{ backgroundColor: "#0284c7", color: "#ffffff", border: "none", borderRadius: "6px", padding: "8px 14px", cursor: "pointer", fontWeight: 600 }}
        >
          Refresh Live Data
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
        {vehicles.map((v) => {
          const isSelected = selectedId === v.id;
          const statusColor = v.status === "MOVING" ? "#10b981" : v.status === "IDLE" ? "#f59e0b" : "#ef4444";

          return (
            <div
              key={v.id}
              onClick={() => handleSelect(v)}
              style={{
                border: isSelected ? "2px solid #38bdf8" : "1px solid #334155",
                borderRadius: "8px",
                padding: "14px",
                backgroundColor: isSelected ? "#1e293b" : "#0f172a",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontWeight: "bold", fontSize: "1rem", color: "#f1f5f9" }}>{v.plateNumber}</span>
                <span style={{ fontSize: "0.75rem", backgroundColor: statusColor, color: "#0f172a", padding: "2px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                  {v.status}
                </span>
              </div>
              <div style={{ fontSize: "0.85rem", color: "#cbd5e1", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div><strong>Driver:</strong> {v.driverName}</div>
                <div><strong>Speed:</strong> {v.speedKmh} km/h</div>
                <div><strong>Battery:</strong> {v.batteryPct}%</div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                  Lat: {v.latitude.toFixed(4)}, Lon: {v.longitude.toFixed(4)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
