"use client";

import React, { useState } from "react";
import Link from "next/link";
import { VehicleTrackingScreen, TelemetryDashboardScreen, GeofenceManagerScreen } from "@geosphere/ui-screens";

export default function DedicatedMapSDKPage() {
  const [activeScreen, setActiveScreen] = useState<"MAP_FLEET" | "TELEMETRY" | "GEOFENCE">("MAP_FLEET");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "24px", fontFamily: "sans-serif" }}>
      {/* Top Header Banner */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #1e293b", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#38bdf8" }}>GeoSphere Web GIS & Map SDK Showcase</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>
            Interactive showcase powered by @geosphere/gis-web and @geosphere/ui-screens
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/dashboard" style={{ color: "#ffffff", backgroundColor: "#0284c7", padding: "8px 14px", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            Fleet Operations Dashboard &rarr;
          </Link>
          <Link href="/sdk-ui-catalog" style={{ color: "#ffffff", backgroundColor: "#334155", padding: "8px 14px", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            SDK UI Catalog &rarr;
          </Link>
        </div>
      </header>

      {/* Screen Selector Tabs */}
      <nav style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveScreen("MAP_FLEET")}
          style={{
            backgroundColor: activeScreen === "MAP_FLEET" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🚗 Live Map Fleet Tracking Screen
        </button>
        <button
          onClick={() => setActiveScreen("TELEMETRY")}
          style={{
            backgroundColor: activeScreen === "TELEMETRY" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          📊 Telemetry & Sensor Analytics
        </button>
        <button
          onClick={() => setActiveScreen("GEOFENCE")}
          style={{
            backgroundColor: activeScreen === "GEOFENCE" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          🛡️ Geofence Boundary Manager
        </button>
      </nav>

      {/* Active Screen Display */}
      <main style={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "12px" }}>
        {activeScreen === "MAP_FLEET" && <VehicleTrackingScreen />}
        {activeScreen === "TELEMETRY" && <TelemetryDashboardScreen />}
        {activeScreen === "GEOFENCE" && <GeofenceManagerScreen />}
      </main>
    </div>
  );
}
