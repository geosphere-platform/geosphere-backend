"use client";

import React from "react";
import {
  VehicleStatusFilter,
  VehicleType,
  VehicleViewMode,
  VehicleFleetStats,
} from "./vehicle-types";

interface VehicleControlBarProps {
  searchQuery: string;
  statusFilter: VehicleStatusFilter;
  typeFilter: "all" | VehicleType;
  viewMode: VehicleViewMode;
  stats: VehicleFleetStats;
  isFullScreen?: boolean;
  onSearchChange: (query: string) => void;
  onStatusFilterChange: (status: VehicleStatusFilter) => void;
  onTypeFilterChange: (type: "all" | VehicleType) => void;
  onViewModeChange: (mode: VehicleViewMode) => void;
  onToggleFullScreen?: () => void;
  onAddVehicleClick: () => void;
  onRefreshClick: () => void;
  isLoading?: boolean;
}

export const VehicleControlBar: React.FC<VehicleControlBarProps> = ({
  searchQuery,
  statusFilter,
  typeFilter,
  viewMode,
  stats,
  isFullScreen = false,
  onSearchChange,
  onStatusFilterChange,
  onTypeFilterChange,
  onViewModeChange,
  onToggleFullScreen,
  onAddVehicleClick,
  onRefreshClick,
  isLoading = false,
}) => {
  const statusTabs: { id: VehicleStatusFilter; label: string; count: number }[] = [
    { id: "all", label: "All Vehicles", count: stats.total },
    { id: "moving", label: "Moving", count: stats.moving },
    { id: "idle", label: "Idle", count: stats.idle },
    { id: "maintenance", label: "Maintenance", count: stats.maintenance },
    { id: "offline", label: "Offline", count: stats.offline },
  ];

  const typeOptions: { id: "all" | VehicleType; label: string }[] = [
    { id: "all", label: "All Types" },
    { id: "truck", label: "Trucks" },
    { id: "van", label: "Delivery Vans" },
    { id: "hauler", label: "Heavy Haulers" },
    { id: "container", label: "Containers" },
    { id: "refrigerated", label: "Cold Chain" },
    { id: "pickup", label: "Pickups" },
    { id: "bus", label: "Buses" },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-xl mb-6 space-y-3.5 transition-colors">
      {/* Top Row: Search & Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by license plate, vehicle name, driver, or make..."
            className="w-full pl-10 pr-9 py-2.5 bg-gray-50 dark:bg-slate-950/80 border border-gray-300 dark:border-slate-700/80 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-sm"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Type Filter Select */}
          <select
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value as any)}
            className="bg-gray-50 dark:bg-slate-950/80 border border-gray-300 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
                {t.label}
              </option>
            ))}
          </select>

          {/* View Mode Toggle (Grid vs Table) */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-950/80 border border-gray-300 dark:border-slate-700/80 rounded-xl p-1 shrink-0">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              title="Card Grid View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("table")}
              title="Tabular Data View"
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Fullscreen Toggle Button */}
          {onToggleFullScreen && (
            <button
              type="button"
              onClick={onToggleFullScreen}
              title={isFullScreen ? "Exit Fullscreen (Esc)" : "Full-Screen Operations Mode (F)"}
              className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                isFullScreen
                  ? "bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-md"
                  : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white border-gray-300 dark:border-slate-700/80"
              }`}
            >
              {isFullScreen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefreshClick}
            disabled={isLoading}
            title="Refresh Fleet Data"
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white rounded-xl border border-gray-300 dark:border-slate-700/80 transition-colors shrink-0 disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={onAddVehicleClick}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/20 transition-all active:scale-95 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Register Vehicle</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pt-1 border-t border-gray-200 dark:border-slate-800/80 scrollbar-none">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusFilterChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800/60 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-slate-900 text-gray-700 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
