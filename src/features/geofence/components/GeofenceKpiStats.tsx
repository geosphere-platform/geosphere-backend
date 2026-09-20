"use client";

import React from "react";
import { GeofenceStats } from "../types";

interface GeofenceKpiStatsProps {
  stats: GeofenceStats;
  onCreateClick?: () => void;
}

export const GeofenceKpiStats: React.FC<GeofenceKpiStatsProps> = ({
  stats,
  onCreateClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Zones */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-slate-700/80 transition-all backdrop-blur-sm">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Total Virtual Zones
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              {stats.total}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Boundaries</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            Depots, hubs & customer sites
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 text-xl flex-shrink-0">
          📍
        </div>
      </div>

      {/* 2. Active Monitoring */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-slate-700/80 transition-all backdrop-blur-sm">
        <div>
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400/90 uppercase tracking-wider">
            Active Monitoring
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stats.active}
            </span>
            <span className="text-xs text-emerald-700/70 dark:text-emerald-400/70 font-medium">
              / {stats.total} Armed
            </span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            Real-time GPS boundary surveillance
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xl flex-shrink-0">
          🛡️
        </div>
      </div>

      {/* 3. Vehicles Inside Now */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-slate-700/80 transition-all backdrop-blur-sm">
        <div>
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400/90 uppercase tracking-wider">
            Vehicles Inside Now
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {stats.vehiclesInside}
            </span>
            <span className="text-xs text-amber-700/70 dark:text-amber-400/70 font-medium">Fleet Units</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            Currently parked or operating inside
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl flex-shrink-0">
          🚚
        </div>
      </div>

      {/* 4. Alerts Triggered Today */}
      <div className="bg-white dark:bg-slate-900/70 border border-gray-200 dark:border-slate-800/80 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-gray-300 dark:hover:border-slate-700/80 transition-all backdrop-blur-sm">
        <div>
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400/90 uppercase tracking-wider">
            Zone Alerts Today
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {stats.alertsToday}
            </span>
            <span className="text-xs text-indigo-700/70 dark:text-indigo-400/70 font-medium">Notifications</span>
          </div>
          <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
            Entry, exit, dwell & speed events
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xl flex-shrink-0">
          🔔
        </div>
      </div>
    </div>
  );
};
