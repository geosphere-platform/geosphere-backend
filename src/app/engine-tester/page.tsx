"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamically import EngineTesterScreen with ssr: false for OpenLayers map client rendering
const EngineTesterScreen = dynamic(
  () => import("@geosphere/ui-screens").then((mod) => mod.EngineTesterScreen),
  { ssr: false }
);

export default function EngineTesterPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#020617", color: "#f8fafc", padding: "16px", fontFamily: "sans-serif" }}>
      {/* Top Header Bar */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid #1e293b", paddingBottom: "12px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.35rem", color: "#38bdf8" }}>GeoSphere 5-Engine Live Map Testing Console</h1>
          <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "#94a3b8" }}>
            Engine 1 (Mapping & Visualization Engine) selected by default — Floating UI controls over 100% full-screen OpenLayers map
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link href="/sdk-ui-catalog" style={{ color: "#ffffff", backgroundColor: "#0284c7", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
            Master SDK UI Catalog &rarr;
          </Link>
          <Link href="/dashboard" style={{ color: "#ffffff", backgroundColor: "#334155", padding: "6px 12px", borderRadius: "6px", textDecoration: "none", fontSize: "0.8rem", fontWeight: 600 }}>
            Dashboard &rarr;
          </Link>
        </div>
      </header>

      {/* Render 5-Engine Interactive Tester (Default: Engine 1 MAPPING) */}
      <main style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #1e293b" }}>
        <EngineTesterScreen initialEngine="MAPPING" />
      </main>
    </div>
  );
}
