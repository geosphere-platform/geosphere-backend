"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

interface AppItem {
  id: string;
  name: string;
  slug: string;
  type: string;
  environment: string;
  status: string;
  clientId: string;
  createdAt: string;
}

export default function ApplicationsListPage() {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEnv, setFilterEnv] = useState<string>("ALL");

  useEffect(() => {
    async function fetchApps() {
      try {
        const res = await fetch("/api/v1/developer/apps");
        const data = await res.json();
        if (data.success) setApps(data.data);
      } catch (err) {
        console.error("Failed to load apps", err);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

  const filteredApps = apps.filter(
    (app) => filterEnv === "ALL" || app.environment === filterEnv,
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">
            Registered Applications
          </h2>
          <p className="text-sm text-slate-400">
            Manage customer software applications and environment credentials.
          </p>
        </div>
        <Link
          href="/developer/apps/new"
          className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20"
        >
          + Register Application
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
        {["ALL", "DEVELOPMENT", "STAGING", "PRODUCTION"].map((env) => (
          <button
            key={env}
            onClick={() => setFilterEnv(env)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterEnv === env
                ? "bg-slate-800 text-cyan-400 border border-slate-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {env}
          </button>
        ))}
      </div>

      {/* Applications Grid */}
      {loading ? (
        <div className="p-8 text-center text-slate-400 text-sm">
          Loading applications...
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <p className="text-slate-300 font-medium">
            No applications found for environment filter: {filterEnv}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredApps.map((app) => (
            <Link
              key={app.id}
              href={`/developer/apps/${app.id}`}
              className="p-6 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl transition-all space-y-4 group relative flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      app.environment === "PRODUCTION"
                        ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        : app.environment === "STAGING"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    }`}
                  >
                    {app.environment}
                  </span>
                  <span
                    className={`text-[11px] font-semibold ${
                      app.status === "ACTIVE"
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    ● {app.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors text-lg">
                    {app.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Client ID: {app.clientId}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>Type: {app.type}</span>
                <span className="text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                  Configure →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
