"use client";

import React, { useEffect, useState } from "react";

export default function UsagePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUsage() {
      try {
        const res = await fetch("/api/v1/developer/usage");
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch (err) {
        console.error("Failed to load usage", err);
      } finally {
        setLoading(false);
      }
    }
    loadUsage();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        Loading usage metrics...
      </div>
    );
  }

  const apiRequestsUsed = data?.usage?.metrics?.API_REQUESTS?.total ?? 0;
  const apiRequestsLimit =
    data?.entitlements?.MAX_API_REQUESTS?.numericValue ?? 100000;
  const apiRequestsPct = Math.min(
    100,
    Math.round((apiRequestsUsed / apiRequestsLimit) * 100),
  );

  const queriesUsed = data?.usage?.metrics?.SPATIAL_QUERIES?.total ?? 0;
  const queriesLimit =
    data?.entitlements?.MAX_SPATIAL_QUERIES?.numericValue ?? 50000;
  const queriesPct = Math.min(
    100,
    Math.round((queriesUsed / queriesLimit) * 100),
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-extrabold text-white">
          API & Metered Usage
        </h2>
        <p className="text-sm text-slate-400">
          Track real-time API requests, spatial query consumption, and
          commercial plan quotas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meter 1: API Requests */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">
              Monthly API Requests
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {apiRequestsUsed.toLocaleString()} /{" "}
              {apiRequestsLimit.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${apiRequestsPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Metered Period: Current Billing Cycle</span>
            <span className="text-cyan-400 font-bold">
              {apiRequestsPct}% Used
            </span>
          </div>
        </div>

        {/* Meter 2: Spatial Queries */}
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">
              Spatial Analytics Queries
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {queriesUsed.toLocaleString()} / {queriesLimit.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${queriesPct}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
            <span>Metered Period: Current Billing Cycle</span>
            <span className="text-emerald-400 font-bold">
              {queriesPct}% Used
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
