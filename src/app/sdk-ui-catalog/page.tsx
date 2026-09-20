"use client";

import React, { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const VehicleTrackingScreen = dynamic(
  () => import("@geosphere/ui-screens").then((mod) => mod.VehicleTrackingScreen),
  { ssr: false }
);

const TelemetryDashboardScreen = dynamic(
  () => import("@geosphere/ui-screens").then((mod) => mod.TelemetryDashboardScreen),
  { ssr: false }
);

const GeofenceManagerScreen = dynamic(
  () => import("@geosphere/ui-screens").then((mod) => mod.GeofenceManagerScreen),
  { ssr: false }
);

const EngineTesterScreen = dynamic(
  () => import("@geosphere/ui-screens").then((mod) => mod.EngineTesterScreen),
  { ssr: false }
);

export default function MasterSDKUICatalogPage() {
  const [activeTab, setActiveTab] = useState<"FLEET" | "TELEMETRY" | "GEOFENCE" | "ENGINE_TESTER">("FLEET");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "24px", fontFamily: "sans-serif" }}>
      {/* Header Navigation */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", borderBottom: "1px solid #1e293b", paddingBottom: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", color: "#38bdf8" }}>GeoSphere Platform — UI Screen & SDK Catalog</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "#94a3b8" }}>
            Modular enterprise UI screens decoupled from core SDK engines
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/engine-tester" style={{ color: "#ffffff", backgroundColor: "#0284c7", padding: "8px 14px", borderRadius: "6px", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}>
            ⚡ Live 5-Engine Tester Console &rarr;
          </Link>
          <Link href="/developer" style={{ color: "#38bdf8", textDecoration: "none", fontSize: "0.9rem", fontWeight: 600, display: "flex", alignItems: "center" }}>
            Developer Portal &rarr;
          </Link>
        </div>
      </header>

      {/* Tab Switcher */}
      <nav style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("FLEET")}
          style={{
            backgroundColor: activeTab === "FLEET" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Vehicle Fleet Tracking Screen
        </button>
        <button
          onClick={() => setActiveTab("TELEMETRY")}
          style={{
            backgroundColor: activeTab === "TELEMETRY" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Telemetry Dashboard Screen
        </button>
        <button
          onClick={() => setActiveTab("GEOFENCE")}
          style={{
            backgroundColor: activeTab === "GEOFENCE" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Geofence Manager Screen
        </button>
        <button
          onClick={() => setActiveTab("ENGINE_TESTER")}
          style={{
            backgroundColor: activeTab === "ENGINE_TESTER" ? "#0284c7" : "#1e293b",
            color: "#ffffff",
            border: "none",
            borderRadius: "6px",
            padding: "10px 18px",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          ⚡ 5-Engine Interactive Tester
        </button>
      </nav>

      {/* Render Active UI Screen Component */}
      <main style={{ backgroundColor: "#0f172a", borderRadius: "12px", border: "1px solid #1e293b", padding: "8px" }}>
        {activeTab === "FLEET" && <VehicleTrackingScreen />}
        {activeTab === "TELEMETRY" && <TelemetryDashboardScreen />}
        {activeTab === "GEOFENCE" && <GeofenceManagerScreen />}
        {activeTab === "ENGINE_TESTER" && <EngineTesterScreen initialEngine="MAPPING" />}
      </main>
    </div>
  );
}
