"use client";

import React from "react";
import { FleetTrackingMetrics, TrackingFilterState, UserLiveLocation } from "../types";

interface LiveTrackingHeaderProps {
  metrics: FleetTrackingMetrics;
  filterState: TrackingFilterState;
  userLocation: UserLiveLocation;
  connectionStatus: "connected" | "polling" | "simulating" | "offline";
  lastPingTime: string;
  onToggleSimulation: () => void;
  onToggleFollow: () => void;
  onToggleBreadcrumbs: () => void;
  onToggleGeofences: () => void;
  onRefresh: () => void;
  onToggleFullScreen?: () => void;
}

export const LiveTrackingHeader: React.FC<LiveTrackingHeaderProps> = ({
  metrics,
  filterState,
  userLocation,
  connectionStatus,
  lastPingTime,
  onToggleSimulation,
  onToggleFollow,
  onToggleBreadcrumbs,
  onToggleGeofences,
  onRefresh,
  onToggleFullScreen,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl text-gray-900 dark:text-white transition-colors">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Left: Title & Live Connection Status */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-600/20 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <svg
              className="w-6 h-6 animate-pulse"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100">
                Live Fleet Tracking
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                {connectionStatus === "simulating"
                  ? "LIVE SIMULATION"
                  : connectionStatus === "connected"
                    ? "SSE REALTIME"
                    : "POLLING ACTIVE"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs text-gray-500 dark:text-slate-400">
                Region: <strong className="text-emerald-600 dark:text-emerald-400">India (Nagpur Hub)</strong> • Updated: {lastPingTime}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                {userLocation.isRealGps
                  ? `User GPS: ${userLocation.latitude}°, ${userLocation.longitude}° (±${userLocation.accuracyMeters}m)`
                  : "User: Central India Zero Mile"}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Fleet Counters */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-gray-50 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800/80 p-2 rounded-xl">
          <div className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/50 flex items-center gap-2 shadow-xs">
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Total:</span>
            <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{metrics.total}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Moving:</span>
            <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{metrics.moving}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Idle:</span>
            <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{metrics.idle}</span>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700/50 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-slate-500" />
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">Offline:</span>
            <span className="text-sm font-bold text-gray-700 dark:text-slate-400">{metrics.offline}</span>
          </div>

          {metrics.overspeed > 0 && (
            <div className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="text-xs text-rose-700 dark:text-rose-300 font-semibold">Overspeed:</span>
              <span className="text-sm font-bold text-rose-700 dark:text-rose-400">{metrics.overspeed}</span>
            </div>
          )}
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Follow Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFollow}
            title={filterState.followSelected ? "Disable auto-camera follow" : "Enable camera auto-follow selected vehicle"}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              filterState.followSelected
                ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/40"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Follow Cam: {filterState.followSelected ? "ON" : "OFF"}
          </button>

          {/* Breadcrumb Trail Toggle */}
          <button
            type="button"
            onClick={onToggleBreadcrumbs}
            title="Toggle historical path trail polyline"
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              filterState.showBreadcrumbs
                ? "bg-indigo-600 text-white border-indigo-400"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Breadcrumbs: {filterState.showBreadcrumbs ? "ON" : "OFF"}
          </button>

          {/* Geofence Toggle */}
          <button
            type="button"
            onClick={onToggleGeofences}
            title="Toggle geofence boundary overlay polygons"
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              filterState.showGeofences
                ? "bg-emerald-700 text-white border-emerald-500"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Geofences
          </button>

          {/* Simulation Toggle */}
          <button
            type="button"
            onClick={onToggleSimulation}
            title={filterState.simulationActive ? "Pause simulated telemetry" : "Resume live telemetry simulation"}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
              filterState.simulationActive
                ? "bg-amber-600 hover:bg-amber-500 text-white border-amber-400"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border-gray-200 dark:border-slate-700"
            }`}
          >
            {filterState.simulationActive ? (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Pause Sim
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Sim
              </>
            )}
          </button>

          {/* Fullscreen Toggle Button */}
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              title="Toggle Fullscreen Command Center (Esc to exit)"
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              ⛶ Fullscreen
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            title="Refresh positions from API"
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
