"use client";

import React, { useState } from "react";
import { LiveTrackingEntity } from "../types";

interface LiveTelemetryHUDProps {
  entity: LiveTrackingEntity | null;
  isFollowing: boolean;
  showBreadcrumbs: boolean;
  onToggleFollow: () => void;
  onToggleBreadcrumbs: () => void;
  onClose: () => void;
}

export const LiveTelemetryHUD: React.FC<LiveTelemetryHUDProps> = ({
  entity,
  isFollowing,
  showBreadcrumbs,
  onToggleFollow,
  onToggleBreadcrumbs,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  if (!entity) {
    return null;
  }

  const isMoving = entity.status === "moving";
  const isIdle = entity.status === "idle";

  // Compute compass cardinal direction from degrees
  const getCardinalDirection = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  return (
    <div className="absolute top-4 right-4 z-20 max-w-sm w-full transition-all duration-200">
      <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border border-gray-200 dark:border-slate-700/80 rounded-2xl shadow-xl dark:shadow-2xl overflow-hidden text-gray-900 dark:text-white transition-colors">
        {/* HUD Card Header */}
        <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                isMoving
                  ? "bg-emerald-500 dark:bg-emerald-400 animate-ping"
                  : isIdle
                    ? "bg-amber-500 dark:bg-amber-400"
                    : "bg-gray-400 dark:bg-slate-500"
              }`}
            />
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
                {entity.name}
              </h3>
              <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
                {entity.licensePlate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand Telemetry HUD" : "Minimize Telemetry HUD"}
              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors text-xs"
            >
              {isMinimized ? "▲" : "▼"}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close Inspector"
              className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* HUD Body (Collapsible) */}
        {!isMinimized && (
          <div className="p-4 space-y-3.5">
            {/* Speed & Heading Visual Gauge */}
            <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-slate-950/70 p-3 rounded-xl border border-gray-200 dark:border-slate-800/80">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">
                  Telemetry Speed
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900 dark:text-slate-100 font-mono">
                    {entity.speed}
                  </span>
                  <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">km/h</span>
                </div>
                {entity.overspeedAlert && (
                  <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-pulse">
                    ⚠️ OVERSPEED LIMIT
                  </span>
                )}
              </div>

              <div className="space-y-0.5 border-l border-gray-200 dark:border-slate-800 pl-3">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider">
                  Bearing Heading
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
                    {entity.heading}°
                  </span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                    ({getCardinalDirection(entity.heading)})
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 block">
                  Alt: {entity.altitudeMeters} m
                </span>
              </div>
            </div>

            {/* Geofence & Location Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-slate-400">Geofence Status:</span>
                {entity.geofenceName ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 truncate max-w-[190px]">
                    📍 Inside: {entity.geofenceName}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400">
                    Outside Monitored Zones
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500 dark:text-slate-400">WGS84 Coordinates:</span>
                <span className="font-mono text-[11px] text-gray-800 dark:text-slate-200 font-semibold">
                  {entity.latitude.toFixed(5)}°, {entity.longitude.toFixed(5)}°
                </span>
              </div>

              {entity.currentAddress && (
                <div className="pt-1 text-[11px] text-gray-700 dark:text-slate-300 bg-gray-50 dark:bg-slate-950/40 p-2 rounded-lg border border-gray-200 dark:border-slate-800/40">
                  <span className="text-gray-400 dark:text-slate-500 block text-[9px] uppercase font-bold">Estimated Location:</span>
                  <span className="truncate block">{entity.currentAddress}</span>
                </div>
              )}
            </div>

            {/* Driver & Telemetry Vitals */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-200 dark:border-slate-800/60">
              <div className="bg-gray-50 dark:bg-slate-950/40 p-2 rounded-lg">
                <span className="text-[9px] uppercase font-bold text-gray-400 dark:text-slate-500 block">Assigned Driver</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200 truncate block">
                  {entity.driverName}
                </span>
                {entity.driverPhone && (
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-0.5 font-medium">
                    📞 {entity.driverPhone}
                  </span>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-slate-950/40 p-2 rounded-lg space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-slate-500">Battery:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{entity.batteryPct}%</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-slate-500">Ignition:</span>
                  <span className={`font-bold ${entity.ignition === "ON" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"}`}>
                    {entity.ignition}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-gray-500 dark:text-slate-500">Signal:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{"📶".repeat(entity.signalStrength || 4)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200 dark:border-slate-800/60">
              <button
                type="button"
                onClick={onToggleFollow}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  isFollowing
                    ? "bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/50"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {isFollowing ? "Following Vehicle" : "Follow Vehicle"}
              </button>

              <button
                type="button"
                onClick={onToggleBreadcrumbs}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                  showBreadcrumbs
                    ? "bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-900/50"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700"
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                {showBreadcrumbs ? "Hide Path" : "Show Path"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
