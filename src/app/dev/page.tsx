"use client";

import React from "react";
import Link from "next/link";

export default function DevShowcasesPage() {
  const demos = [
    {
      title: "Logistics & Fleet Operations Demo",
      description: "Interactive fleet simulation with live telemetry, corridor route matching, and driver dispatch.",
      href: "/dev/logistics-demo",
      icon: "🚚",
      badge: "Fleet GIS",
    },
    {
      title: "Precision Agriculture Demo",
      description: "Field boundaries, crop zone monitoring, NDVI spatial queries, and automated tractor tracking.",
      href: "/dev/agriculture-demo",
      icon: "🌾",
      badge: "Agri GIS",
    },
    {
      title: "OpenLayers Modular GIS Map",
      description: "Vector layer composition, real-time spatial clustering, and vector tiles rendering.",
      href: "/dev/gis-map",
      icon: "🗺️",
      badge: "Map Engine",
    },
    {
      title: "GIS Spatial Automation Rules",
      description: "Geofence triggers, speed alarms, idle alerts, and visual rule builder with live evaluation.",
      href: "/dev/gis-rules",
      icon: "⚡",
      badge: "Rules Engine",
    },
    {
      title: "Multi-Tenant SaaS Isolation",
      description: "Cross-tenant security boundaries, organization contexts, and role-scoped permissions.",
      href: "/dev/saas-tenant",
      icon: "🏢",
      badge: "SaaS Security",
    },
    {
      title: "Web SDK Integration Demo",
      description: "Demonstration of consuming @saurabhnagare-sys/geosphere-web-sdk in external applications.",
      href: "/dev/sdk-demo",
      icon: "📦",
      badge: "Web SDK",
    },
    {
      title: "Developer Quickstart Guide",
      description: "Step-by-step code snippets, API key authentication, and SDK configuration examples.",
      href: "/dev/developer-quickstart",
      icon: "📖",
      badge: "Documentation",
    },
    {
      title: "Interactive GIS Engine Tester",
      description: "Low-level automated stress test harness for GIS math, geometry validation, and PostGIS ops.",
      href: "/engine-tester",
      icon: "🧪",
      badge: "Engine Tester",
    },
    {
      title: "SDK UI Component Catalog",
      description: "Reusable component design system showcase with live interactive property controls.",
      href: "/sdk-ui-catalog",
      icon: "🎨",
      badge: "UI Catalog",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 sm:p-10 font-sans space-y-8">
      {/* Top Banner */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Developer Ecosystem
            </span>
            <span className="text-xs text-slate-400">• Interactive Sandboxes</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-2">
            GeoSphere Platform Showcase Hub
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Explore interactive domain showcases, map engine features, rules engines, and SDK integration examples.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg self-start sm:self-auto"
        >
          <span>&larr; Back to Dashboard</span>
        </Link>
      </div>

      {/* Demos Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {demos.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            className="group p-6 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/90 hover:border-indigo-500/60 rounded-3xl transition-all shadow-lg flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-3xl p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  {demo.icon}
                </span>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                  {demo.badge}
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-4 group-hover:text-indigo-300 transition-colors">
                {demo.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                {demo.description}
              </p>
            </div>

            <div className="flex items-center text-xs font-bold text-indigo-400 group-hover:translate-x-1.5 transition-transform pt-2">
              <span>Launch Sandbox &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
