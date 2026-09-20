"use client";

import React from "react";
import {
  GeofenceZoneItem,
  GeofenceCategory,
  GeofenceShapeType,
  GEOFENCE_CATEGORY_METADATA,
} from "../types";

export interface GeofenceSidebarListProps {
  zones: GeofenceZoneItem[];
  selectedZoneId: string | null;
  searchQuery: string;
  categoryFilter: "all" | GeofenceCategory;
  shapeFilter: "all" | GeofenceShapeType;
  onSearchChange: (query: string) => void;
  onCategoryChange: (category: "all" | GeofenceCategory) => void;
  onShapeChange: (shape: "all" | GeofenceShapeType) => void;
  onSelectZone: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onRequestDelete: (zone: GeofenceZoneItem) => void;
  onCreateClick: () => void;
}

const CATEGORY_TABS: Array<{ key: "all" | GeofenceCategory; label: string; icon: string }> = [
  { key: "all", label: "All", icon: "🌐" },
  { key: "depot", label: "Depots", icon: "🏭" },
  { key: "customer", label: "Customers", icon: "🏢" },
  { key: "restricted", label: "Restricted", icon: "🛑" },
  { key: "terminal", label: "Terminals", icon: "✈️" },
  { key: "service", label: "Services", icon: "⛽" },
];

export const GeofenceSidebarList: React.FC<GeofenceSidebarListProps> = ({
  zones,
  selectedZoneId,
  searchQuery,
  categoryFilter,
  shapeFilter,
  onSearchChange,
  onCategoryChange,
  onShapeChange,
  onSelectZone,
  onToggleEnabled,
  onRequestDelete,
  onCreateClick,
}) => {
  return (
    <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-lg h-full min-h-[500px] text-gray-900 dark:text-white transition-colors">
      {/* Top Header & Create Button */}
      <div className="p-3.5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-gray-50/80 dark:bg-slate-900/60">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-wide">
            Virtual Zones & Geofences
          </h2>
          <p className="text-[11px] text-gray-500 dark:text-slate-400">
            {zones.length} {zones.length === 1 ? "zone" : "zones"} configured
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateClick}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md hover:shadow-blue-500/20 transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <span>+</span>
          <span>New Zone</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-200 dark:border-slate-800/80">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-gray-400 dark:text-slate-400 pointer-events-none text-xs">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search zones or vehicle plate (e.g. MH-31)..."
            className="w-full pl-8 pr-8 py-1.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-300 dark:border-slate-700/80 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto no-scrollbar">
        {CATEGORY_TABS.map((tab) => {
          const isActive = categoryFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onCategoryChange(tab.key)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800/60 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Shape Filter Pills */}
      <div className="px-3 py-1.5 border-b border-gray-200 dark:border-slate-800/60 bg-gray-50/80 dark:bg-slate-900/40 flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400">
        <span>Boundary Type:</span>
        <div className="flex items-center gap-1">
          {(["all", "admin_region", "circle", "polygon"] as const).map((shape) => (
            <button
              key={shape}
              type="button"
              onClick={() => onShapeChange(shape)}
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold transition-colors ${
                shapeFilter === shape
                  ? "bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {shape === "all"
                ? "All"
                : shape === "admin_region"
                  ? "Admin 🏛️"
                  : shape === "circle"
                    ? "Circle ⭕"
                    : "Polygon 📐"}
            </button>
          ))}
        </div>
      </div>

      {/* Zones List */}
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800/60 p-2 space-y-1">
        {zones.length === 0 ? (
          <div className="py-12 px-4 text-center">
            <p className="text-3xl mb-2">📍</p>
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No zones found</p>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-1">
              Try adjusting your search query or category filter.
            </p>
          </div>
        ) : (
          zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const meta = GEOFENCE_CATEGORY_METADATA[zone.category];
            const hasVehicles = zone.activeVehiclesCount > 0;

            return (
              <div
                key={zone.id}
                onClick={() => onSelectZone(zone.id)}
                className={`group p-3 rounded-lg cursor-pointer transition-all border ${
                  isSelected
                    ? "bg-blue-50/80 dark:bg-slate-800/90 border-blue-500/80 shadow-xs ring-1 ring-blue-500/30"
                    : "bg-gray-50/60 hover:bg-gray-100/80 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 border-gray-200 dark:border-slate-800/60 hover:border-gray-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Zone Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: zone.color }}
                      title={meta.label}
                    />
                    <h3 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[190px]">
                      {zone.name}
                    </h3>
                  </div>

                  {/* Active Toggle Switch */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleEnabled(zone.id);
                    }}
                    title={zone.enabled ? "Surveillance Active (Click to disable)" : "Surveillance Disabled (Click to activate)"}
                    className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                      zone.enabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-slate-700"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        zone.enabled ? "translate-x-3" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Subtitle / Category & Shape */}
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 text-gray-700 dark:text-slate-300">
                    <span>{meta.icon}</span>
                    <span>{meta.label}</span>
                  </span>
                  <span>•</span>
                  <span className="capitalize text-[10px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 font-mono text-gray-700 dark:text-slate-300">
                    {zone.shapeType === "circle"
                      ? `⭕ ${zone.radiusMeters}m`
                      : zone.shapeType === "admin_region"
                        ? `🏛️ ${zone.adminRegion?.level ? zone.adminRegion.level.toUpperCase() : "ADMIN"}`
                        : "📐 Polygon"}
                  </span>
                </div>

                {/* Live Fleet Presence Badge */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {hasVehicles ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                        🚚 {zone.activeVehiclesCount} {zone.activeVehiclesCount === 1 ? "Vehicle" : "Vehicles"} Inside
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-slate-400">
                        0 Vehicles Inside
                      </span>
                    )}
                  </div>

                  {/* Actions (Delete button) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(zone);
                      }}
                      title="Delete Virtual Zone"
                      className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-gray-200 dark:hover:bg-slate-700/50 text-xs transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Vehicle Plate List if any */}
                {hasVehicles && (
                  <div className="mt-2 pt-1.5 border-t border-gray-200 dark:border-slate-800/80 flex flex-wrap gap-1">
                    {zone.activeVehiclePlates.map((plate) => (
                      <span
                        key={plate}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700/80 text-blue-600 dark:text-blue-300 font-semibold"
                      >
                        {plate}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
