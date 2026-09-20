import React from "react";

export interface TelemetryDashboardScreenProps {
  totalAssets?: number;
  activeGeofences?: number;
  liveAlertsCount?: number;
  avgSpeedKmh?: number;
}

export const TelemetryDashboardScreen: React.FC<TelemetryDashboardScreenProps> = ({
  totalAssets = 142,
  activeGeofences = 18,
  liveAlertsCount = 3,
  avgSpeedKmh = 38.4,
}) => {
  return (
    <div style={{ padding: "16px", backgroundColor: "#0f172a", color: "#f8fafc", borderRadius: "12px", fontFamily: "sans-serif" }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "1.25rem", color: "#38bdf8" }}>Telemetry Analytics Dashboard</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <div style={{ backgroundColor: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Total Fleet Assets</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f8fafc", marginTop: "4px" }}>{totalAssets}</div>
        </div>
        <div style={{ backgroundColor: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Active Geofences</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981", marginTop: "4px" }}>{activeGeofences}</div>
        </div>
        <div style={{ backgroundColor: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Live Telemetry Alerts</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#ef4444", marginTop: "4px" }}>{liveAlertsCount}</div>
        </div>
        <div style={{ backgroundColor: "#1e293b", padding: "14px", borderRadius: "8px", border: "1px solid #334155" }}>
          <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Avg Fleet Speed</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#38bdf8", marginTop: "4px" }}>{avgSpeedKmh} km/h</div>
        </div>
      </div>

      <div style={{ backgroundColor: "#1e293b", padding: "16px", borderRadius: "8px", border: "1px solid #334155" }}>
        <h4 style={{ margin: "0 0 8px 0", color: "#e2e8f0" }}>Live Telemetry Stream Status</h4>
        <div style={{ fontSize: "0.85rem", color: "#94a3b8" }}>
          MQTT Ingestion Status: <span style={{ color: "#10b981", fontWeight: "bold" }}>CONNECTED (0.12s latency)</span>
        </div>
      </div>
    </div>
  );
};
