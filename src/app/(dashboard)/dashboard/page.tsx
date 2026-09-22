"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useDashboardAuth } from "@/features/dashboard/hooks/useDashboardAuth";

interface ServerControlData {
  server: {
    status: "ONLINE" | "OFFLINE";
    lastChangedAt: string;
    lastChangedBy: string;
    uptimeSeconds: number;
  };
  database: {
    status: string;
    postgis: string | null;
    pool: {
      activeCount: number;
      idleCount: number;
      totalCount: number;
      waitingCount: number;
      maxConnections: number;
    };
  };
  system: {
    nodeVersion: string;
    heapUsedMb: number;
    rssMb: number;
  };
}

export default function ServerControlDashboardPage() {
  const { user, isLoading: authLoading, logout } = useDashboardAuth();
  const [data, setData] = useState<ServerControlData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toggling, setToggling] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );
  const [confirmStop, setConfirmStop] = useState<boolean>(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/server-control", { credentials: "same-origin" });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch server diagnostic status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleToggleServer = async (action: "START" | "STOP") => {
    setToggling(true);
    setFeedback(null);
    setConfirmStop(false);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("gis_access_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/v1/admin/server-control", {
        method: "POST",
        headers,
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to update server status");
      }

      setFeedback({
        type: "success",
        message: json.data?.message || `Server successfully transitioned to ${action}ED`,
      });

      await fetchStatus();
    } catch (err) {
      setFeedback({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to toggle server state",
      });
    } finally {
      setToggling(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hrs = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  if (authLoading || (loading && !data)) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Connecting to GeoSphere Core Engine...</p>
      </div>
    );
  }

  const isOnline = data?.server.status === "ONLINE";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              GeoSphere Platform Ops
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                Admin Console
              </span>
            </h1>
            <p className="text-xs text-slate-400">Enterprise GIS & Telemetry Engine Lifecycle</p>
          </div>
        </div>

        {/* User Badge & Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-200">
              {user ? `${user.firstName} ${user.lastName}` : "Administrator"}
            </div>
            <div className="text-[11px] text-blue-400 font-mono">
              {user?.role || "PLATFORM_ADMIN"}
            </div>
          </div>
          <button
            onClick={logout}
            className="px-3.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{feedback.type === "success" ? "✓" : "⚠"}</span>
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ─── HERO POWER SWITCH CARD ────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/90 to-slate-900/40 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium tracking-wide uppercase font-mono">
                {isOnline ? (
                  <span className="flex items-center gap-2 text-emerald-400 border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Server Status: Online & Active
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-rose-400 border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Server Status: Stopped / Offline
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {isOnline ? "API & Telemetry Ingestion is Active" : "Server Gateway is Suspended"}
              </h2>

              <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                {isOnline
                  ? "All field devices, mobile batch GPS syncs, and web GIS query APIs are actively processing coordinates and evaluating geofences in real time."
                  : "Maintenance mode is engaged. Incoming mobile GPS breadcrumbs and public APIs are returning HTTP 503. Only administrators can access this console."}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
                <span>
                  Uptime: <strong className="text-slate-200">{formatUptime(data?.server.uptimeSeconds ?? 0)}</strong>
                </span>
                <span>•</span>
                <span>
                  Last State Change:{" "}
                  <strong className="text-slate-200">
                    {data?.server.lastChangedAt
                      ? new Date(data.server.lastChangedAt).toLocaleTimeString()
                      : "Startup"}
                  </strong>
                </span>
              </div>
            </div>

            {/* Action Button Section */}
            <div className="flex flex-col items-center sm:items-end justify-center min-w-[200px]">
              {isOnline ? (
                confirmStop ? (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <p className="text-xs text-rose-400 text-center font-medium">
                      Confirm: Pause all public traffic?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleServer("STOP")}
                        disabled={toggling}
                        className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {toggling ? "Stopping..." : "Yes, Stop Server"}
                      </button>
                      <button
                        onClick={() => setConfirmStop(false)}
                        className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmStop(true)}
                    disabled={toggling}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-base shadow-xl shadow-rose-600/25 transition-all active:scale-95 flex items-center justify-center gap-3 border border-rose-400/30"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                      />
                    </svg>
                    STOP SERVER
                  </button>
                )
              ) : (
                <button
                  onClick={() => handleToggleServer("START")}
                  disabled={toggling}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-base shadow-xl shadow-emerald-500/25 transition-all active:scale-95 flex items-center justify-center gap-3 border border-emerald-400/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {toggling ? "Starting..." : "START SERVER"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── GRID: DATABASE & SYSTEM HEALTH ────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PostGIS Database Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">PostgreSQL + PostGIS</h3>
                  <p className="text-xs text-slate-400">Spatial Persistence Engine</p>
                </div>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                  data?.database.status === "CONNECTED"
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                }`}
              >
                {data?.database.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">Extension</div>
                <div className="text-sm font-semibold text-slate-200 truncate" title={data?.database.postgis || "PostGIS 3.5"}>
                  {data?.database.postgis ? `v${data.database.postgis.slice(0, 5)}` : "PostGIS 3.5"}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">Active Pool</div>
                <div className="text-sm font-semibold text-slate-200">
                  {data?.database.pool.activeCount ?? 0} / {data?.database.pool.maxConnections ?? 20}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">Idle Pool</div>
                <div className="text-sm font-semibold text-slate-200">
                  {data?.database.pool.idleCount ?? 0}
                </div>
              </div>
            </div>
          </div>

          {/* Node.js Runtime & Memory Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Node.js Core Runtime</h3>
                  <p className="text-xs text-slate-400">Server Health & Memory</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {data?.system.nodeVersion || process.version}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">Heap Used</div>
                <div className="text-sm font-semibold text-slate-200">
                  {data?.system.heapUsedMb ?? 0} MB
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <div className="text-xs text-slate-400">Process RSS</div>
                <div className="text-sm font-semibold text-slate-200">
                  {data?.system.rssMb ?? 0} MB
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SECURITY & AUDIT ASSURANCE NOTE ───────────────────────────────── */}
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/30 p-5 flex items-start gap-3.5 text-xs text-slate-400">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-200">Enterprise Security & Non-Repudiation:</span> All START and STOP lifecycle operations require authenticated PLATFORM_ADMIN credentials. Every action is permanently written to the immutable <code className="text-slate-300 font-mono bg-slate-800 px-1 py-0.5 rounded">audit_logs</code> database table with your user ID, IP address, and timestamp.
          </div>
        </div>
      </main>
    </div>
  );
}
