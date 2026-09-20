"use client";

import React from "react";
import Link from "next/link";
import { GeofenceZoneItem, GEOFENCE_CATEGORY_METADATA } from "../types";

export interface GeofenceDetailsDrawerProps {
  zone: GeofenceZoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleEnabled: (id: string) => void;
  onRequestDelete: (zone: GeofenceZoneItem) => void;
}

export const GeofenceDetailsDrawer: React.FC<GeofenceDetailsDrawerProps> = ({
  zone,
  isOpen,
  onClose,
  onToggleEnabled,
  onRequestDelete,
}) => {
  if (!isOpen || !zone) return null;

  const meta = GEOFENCE_CATEGORY_METADATA[zone.category];
  const [centerLon, centerLat] = zone.center;

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-white font-sans animate-in slide-in-from-right duration-200 transition-colors">
      {/* Drawer Header */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-xl">{meta.icon}</span>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-slate-400">
              Virtual Boundary Details
            </span>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[230px]">
              {zone.name}
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center transition-colors text-xs"
        >
          ✕
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Status & Category Strip */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800">
          <div>
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium">Surveillance Status</p>
            <p className="text-xs font-bold mt-0.5 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  zone.enabled ? "bg-emerald-500 animate-pulse" : "bg-gray-400 dark:bg-slate-500"
                }`}
              />
              <span className={zone.enabled ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-slate-400"}>
                {zone.enabled ? "Active Real-Time Monitoring" : "Surveillance Inactive"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => onToggleEnabled(zone.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              zone.enabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-gray-200 hover:bg-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200"
            }`}
          >
            {zone.enabled ? "Disable" : "Activate"}
          </button>
        </div>

        {/* Boundary Specifications */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
            Boundary Specifications
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] block">Zone Type</span>
              <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block capitalize">
                {zone.shapeType === "circle"
                  ? "Circular Radius ⭕"
                  : zone.shapeType === "admin_region"
                    ? `Admin: ${zone.adminRegion?.level?.toUpperCase() || "REGION"} 🏛️`
                    : "Custom Polygon 📐"}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] block">Coverage</span>
              <span className="font-semibold text-gray-900 dark:text-white mt-0.5 block">
                {zone.shapeType === "circle"
                  ? `${zone.radiusMeters}m (${((zone.radiusMeters || 0) / 1000).toFixed(1)} km)`
                  : zone.adminRegion
                    ? `${zone.adminRegion.areaSqKm.toLocaleString()} km²`
                    : `${zone.areaHectares || 120} Hectares`}
              </span>
            </div>

            {zone.adminRegion && (
              <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 col-span-2">
                <span className="text-blue-700 dark:text-blue-300 text-[11px] font-semibold block">
                  🏛️ Official Administrative Region
                </span>
                <span className="text-xs text-gray-900 dark:text-white font-bold mt-0.5 block">
                  {zone.adminRegion.adminName}
                </span>
                <span className="text-[10px] text-gray-600 dark:text-slate-300 mt-0.5 block">
                  Level: {zone.adminRegion.level.toUpperCase()} • Country: {zone.adminRegion.countryCode}
                  {zone.adminRegion.stateCode ? ` • State: ${zone.adminRegion.stateCode}` : ""}
                  {zone.adminRegion.perimeterKm ? ` • Perimeter: ${zone.adminRegion.perimeterKm} km` : ""}
                </span>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800 col-span-2">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] block">GPS Center Coordinate</span>
              <span className="font-mono text-[11px] text-blue-600 dark:text-blue-300 mt-0.5 block">
                {centerLat.toFixed(4)}° N, {centerLon.toFixed(4)}° E
              </span>
            </div>
          </div>

          {zone.description && (
            <p className="text-xs text-gray-600 dark:text-slate-400 bg-gray-50 dark:bg-slate-800/20 p-2.5 rounded-lg border border-gray-200 dark:border-slate-800/60 leading-relaxed">
              {zone.description}
            </p>
          )}
        </div>

        {/* Live Vehicles Currently Inside */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Vehicles Inside Now</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/60 font-mono font-bold">
                {zone.activeVehiclesCount}
              </span>
            </h3>
          </div>

          {zone.activeVehiclesCount === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/30 border border-gray-200 dark:border-slate-800 text-center">
              <p className="text-xl mb-1">🚚</p>
              <p className="text-xs font-medium text-gray-700 dark:text-slate-300">No vehicles inside</p>
              <p className="text-[11px] text-gray-500 dark:text-slate-500 mt-0.5">
                Vehicles entering this zone will be logged automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {zone.activeVehiclePlates.map((plate) => (
                <div
                  key={plate}
                  className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700/80 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                    <div>
                      <span className="text-xs font-mono font-bold text-gray-900 dark:text-white block">
                        {plate}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-slate-400 block">
                        GPS Active • Inside boundary
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/tracking?search=${encodeURIComponent(plate)}`}
                    className="px-2.5 py-1 rounded bg-blue-600/80 hover:bg-blue-600 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                  >
                    <span>Track</span>
                    <span>→</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alert Rules Configured */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-700 dark:text-slate-300 uppercase tracking-wider">
            Automated Alert Triggers
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800/80">
              <span className="text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🚪</span> Entry Notification
              </span>
              <span
                className={`font-semibold ${
                  zone.alertTriggers.onEnter ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {zone.alertTriggers.onEnter ? "Enabled" : "Disabled"}
              </span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800/80">
              <span className="text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>🏃</span> Exit Notification
              </span>
              <span
                className={`font-semibold ${
                  zone.alertTriggers.onExit ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-slate-500"
                }`}
              >
                {zone.alertTriggers.onExit ? "Enabled" : "Disabled"}
              </span>
            </div>

            {zone.alertTriggers.onDwell && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800/80">
                <span className="text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>⏱️</span> Dwell Alert ({zone.alertTriggers.dwellMinutes || 30} mins)
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">Active</span>
              </div>
            )}

            {zone.alertTriggers.maxSpeedKmh && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-800/80">
                <span className="text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span>⚡</span> Speed Limit Alert
                </span>
                <span className="text-red-600 dark:text-red-400 font-semibold font-mono">
                  {zone.alertTriggers.maxSpeedKmh} km/h max
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/90 dark:bg-slate-900/90 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onRequestDelete(zone)}
          className="px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:border-red-800/50 dark:text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
        >
          <span>🗑️</span>
          <span>Delete Zone</span>
        </button>

        <Link
          href="/dashboard/tracking"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-1.5"
        >
          <span>Live Fleet Map</span>
          <span>→</span>
        </Link>
      </div>
    </aside>
  );
};
