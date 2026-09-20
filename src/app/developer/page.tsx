"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface AppItem {
  id: string;
  name: string;
  type: string;
  environment: string;
  status: string;
  clientId: string;
  createdAt: string;
}

export default function DeveloperDashboardPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [appsRes, usageRes] = await Promise.all([
          fetch("/api/v1/developer/apps"),
          fetch("/api/v1/developer/usage"),
        ]);
        const appsData = await appsRes.json();
        const usageData = await usageRes.json();

        if (appsData.success) setApps(appsData.data);
        if (usageData.success) setUsage(usageData.data);
      } catch (err) {
        console.error("Failed to load developer dashboard", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-8 rounded-3xl border border-slate-800 shadow-xl">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            Developer Platform Overview
          </h2>
          <p className="text-slate-400 text-sm max-w-2xl">
            Register client applications, manage development/staging/production
            API keys, configure CORS origins & scopes, and monitor SDK platform
            consumption.
          </p>
        </div>
        <Link
          href="/developer/apps/new"
          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-2xl shadow-lg shadow-cyan-500/25 transition-all text-sm self-start md:self-auto shrink-0 flex items-center space-x-2"
        >
          <span>+ Register New Application</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Registered Applications
          </div>
          <div className="text-3xl font-extrabold text-white">
            {apps.length}
          </div>
          <p className="text-xs text-slate-500">
            Multi-application org structure
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Active Environments
          </div>
          <div className="text-3xl font-extrabold text-cyan-400">
            {new Set(apps.map((a) => a.environment)).size}
          </div>
          <p className="text-xs text-slate-500">DEV, STAGING, PRODUCTION</p>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Monthly API Requests
          </div>
          <div className="text-3xl font-extrabold text-emerald-400">
            {usage?.usage?.metrics?.API_REQUESTS?.total?.toLocaleString() ?? 0}
          </div>
          <p className="text-xs text-slate-500">
            Limit:{" "}
            {usage?.entitlements?.MAX_API_REQUESTS?.numericValue?.toLocaleString() ??
              "100,000"}{" "}
            / mo
          </p>
        </div>

        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2 shadow-md">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Enabled SDK Modules
          </div>
          <div className="text-3xl font-extrabold text-indigo-400">7</div>
          <p className="text-xs text-slate-500">MAP, LAYERS, TRACKING, etc.</p>
        </div>
      </div>

      {/* Quick Start Card */}
      <div className="p-6 bg-slate-900/80 border border-cyan-800/30 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🚀</span>
            <div>
              <h3 className="font-bold text-white text-base">
                Quick Start GIS SDK Integration
              </h3>
              <p className="text-xs text-slate-400">
                Integrate the Phase 14 Reusable GIS Map SDK in less than 2
                minutes
              </p>
            </div>
          </div>
          <Link
            href="/developer/docs"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            View Full Docs →
          </Link>
        </div>
        <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
          <code>
            {`import { GisMapClient } from '@gis/sdk';\n\nconst gis = new GisMapClient({\n  clientId: 'app_dev_xxxxxx',\n  apiKey: 'gsk_dev_xxxxxx',\n  environment: 'DEVELOPMENT'\n});\nawait gis.initialize();`}
          </code>
        </div>
      </div>

      {/* Applications List Preview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Your Applications</h3>
          <Link
            href="/developer/apps"
            className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Manage All Applications ({apps.length}) →
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
            Loading applications...
          </div>
        ) : apps.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
            <p className="text-slate-300 font-medium">
              No applications registered yet
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create an application to receive public client IDs and generate
              environment API keys.
            </p>
            <Link
              href="/developer/apps/new"
              className="inline-block px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-all"
            >
              + Register First Application
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {apps.slice(0, 4).map((app) => (
              <Link
                key={app.id}
                href={`/developer/apps/${app.id}`}
                className="p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all space-y-4 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-base">
                      {app.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Client ID: {app.clientId}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                      app.environment === "PRODUCTION"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : app.environment === "STAGING"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    }`}
                  >
                    {app.environment}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>Type: {app.type}</span>
                  <span className="text-emerald-400 font-medium">
                    ● {app.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
