"use client";

import React, { useState, useEffect, useCallback } from "react";

interface AuditEvent {
  id: string;
  timestamp: string;
  action: string;
  actor: {
    id: string;
    email: string;
    role: string;
  };
  entityType: "AUTH" | "VEHICLE" | "GEOFENCE" | "DISPATCH" | "SYSTEM" | "ORGANIZATION";
  entityId: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ipAddress: string;
  details: string;
}

export default function AuditLogsPage() {
  const [severityFilter, setSeverityFilter] = useState<"ALL" | "INFO" | "WARNING" | "CRITICAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("gis_access_token");
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(
        `/api/v1/audit?severity=${severityFilter}&search=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data?.events)) {
          setEvents(json.data.events);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, [severityFilter, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAuditLogs();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchAuditLogs]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-xl text-gray-900 dark:text-white transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30">
              SOC 2 / ISO 27001 Compliance
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">• Immutable Security Ledger</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1.5 text-gray-900 dark:text-white">
            Security & Platform Audit Logs
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-300 mt-1">
            Complete traceability of authentication sessions, boundary definitions, vehicle updates, and dispatch changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAuditLogs}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            🔄 Refresh Log
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 mr-1">Severity:</span>
          {(["ALL", "INFO", "WARNING", "CRITICAL"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                severityFilter === sev
                  ? sev === "CRITICAL"
                    ? "bg-red-600 text-white shadow"
                    : sev === "WARNING"
                      ? "bg-amber-600 text-white shadow"
                      : sev === "INFO"
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-800 dark:bg-slate-700 text-white shadow"
                  : "bg-gray-100 dark:bg-slate-800/80 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, IP, or entity ID..."
            className="w-full px-3 py-1.5 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950/50 text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Actor / Role</th>
                <th className="py-3 px-3">Target Entity</th>
                <th className="py-3 px-3">Severity</th>
                <th className="py-3 px-3">Origin IP</th>
                <th className="py-3 px-3">Action Details</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-sans">
              {events.map((evt) => (
                <tr key={evt.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-gray-500 dark:text-slate-400 whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono font-bold text-gray-900 dark:text-white text-[11px]">
                      {evt.action}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-gray-900 dark:text-white font-medium">{evt.actor.email}</div>
                    <div className="text-[10px] text-gray-400 dark:text-slate-500">{evt.actor.role}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 mr-1.5 uppercase text-[10px] border border-gray-200 dark:border-slate-700">
                      {evt.entityType}
                    </span>
                    {evt.entityId}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        evt.severity === "CRITICAL"
                          ? "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/60"
                          : evt.severity === "WARNING"
                            ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60"
                            : "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60"
                      }`}
                    >
                      {evt.severity}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-gray-500 dark:text-slate-400">
                    {evt.ipAddress}
                  </td>
                  <td className="py-3 px-3 max-w-xs truncate text-gray-600 dark:text-slate-300">
                    {evt.details}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedEvent(evt)}
                      className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      View &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Modal / Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 text-gray-900 dark:text-white space-y-4 font-sans transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Audit Event Details
                </h3>
                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">
                  {selectedEvent.id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800">
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Action</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">
                    {selectedEvent.action}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Severity</span>
                  <span className="font-bold text-gray-900 dark:text-white">{selectedEvent.severity}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Actor Email</span>
                  <span className="text-gray-800 dark:text-white">{selectedEvent.actor.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Actor Role</span>
                  <span className="text-gray-800 dark:text-white">{selectedEvent.actor.role}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Target Entity</span>
                  <span className="font-mono text-gray-900 dark:text-white">
                    {selectedEvent.entityType}: {selectedEvent.entityId}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-slate-400 block text-[11px]">Source IP</span>
                  <span className="font-mono text-gray-900 dark:text-white">{selectedEvent.ipAddress}</span>
                </div>
              </div>

              <div>
                <span className="text-gray-500 dark:text-slate-400 block text-[11px] mb-1">
                  Full Payload Description
                </span>
                <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-800 dark:text-slate-200 leading-relaxed font-mono text-[11px]">
                  {selectedEvent.details}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
