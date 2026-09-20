"use client";

import React from "react";
import { LiveTrackingEntity, TrackingStatusFilter } from "../types";

interface LiveFleetSidebarProps {
  entities: LiveTrackingEntity[];
  selectedEntityId: string | null;
  statusFilter: TrackingStatusFilter;
  searchQuery: string;
  onSelectEntity: (id: string) => void;
  onStatusFilterChange: (status: TrackingStatusFilter) => void;
  onSearchChange: (query: string) => void;
}

export const LiveFleetSidebar: React.FC<LiveFleetSidebarProps> = ({
  entities,
  selectedEntityId,
  statusFilter,
  searchQuery,
  onSelectEntity,
  onStatusFilterChange,
  onSearchChange,
}) => {
  const filterOptions: { key: TrackingStatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "moving", label: "Moving" },
    { key: "idle", label: "Idle" },
    { key: "offline", label: "Offline" },
  ];

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex flex-col bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden text-gray-900 dark:text-white flex-shrink-0 h-[680px] transition-colors">
      {/* Sidebar Header & Search */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-slate-300">
            Fleet Directory ({entities.length})
          </h2>
          <span className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
            Select to track
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <svg
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400"
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
            placeholder="Search by plate, vehicle, driver..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {filterOptions.map((opt) => {
            const isActive = statusFilter === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onStatusFilterChange(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-shrink-0 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700/60"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vehicles Scrollable List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 divide-y divide-gray-100 dark:divide-slate-800/40">
        {entities.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">No vehicles found</p>
            <p className="text-[11px] text-gray-500 dark:text-slate-500">
              Try adjusting your filter or search criteria
            </p>
          </div>
        ) : (
          entities.map((v) => {
            const isSelected = selectedEntityId === v.id;
            const isMoving = v.status === "moving";
            const isIdle = v.status === "idle";

            return (
              <div
                key={v.id}
                onClick={() => onSelectEntity(v.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-150 border ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500/80 shadow-md shadow-blue-500/10 dark:shadow-blue-950/50"
                    : "bg-gray-50/80 dark:bg-slate-950/40 border-gray-200 dark:border-slate-800/70 hover:bg-gray-100/80 dark:hover:bg-slate-800/40 hover:border-gray-300 dark:hover:border-slate-700"
                }`}
              >
                {/* Top Row: Plate & Status Pill */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 shadow-2xs">
                    {v.licensePlate}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                      isMoving
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : isIdle
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          : "bg-gray-100 dark:bg-slate-700/30 text-gray-500 dark:text-slate-400 border border-gray-300 dark:border-slate-700"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isMoving
                          ? "bg-emerald-500 dark:bg-emerald-400 animate-ping"
                          : isIdle
                            ? "bg-amber-500 dark:bg-amber-400"
                            : "bg-gray-400 dark:bg-slate-500"
                      }`}
                    />
                    {v.status}
                  </span>
                </div>

                {/* Second Row: Name & Driver */}
                <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate mb-1">
                  {v.name}
                </h3>

                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-slate-400 mb-2">
                  <span className="truncate">👤 {v.driverName}</span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500">{v.lastUpdated}</span>
                </div>

                {/* Geofence Working Zone Badge */}
                {v.geofenceName && (
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40 truncate mb-2">
                    <span className="flex-shrink-0">📍</span>
                    <span className="truncate">{v.geofenceName}</span>
                  </div>
                )}

                {/* Third Row: Speed & Battery Metrics */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-200 dark:border-slate-800/60 text-[11px]">
                  <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-transparent px-2 py-1 rounded text-center shadow-2xs">
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 block uppercase">Speed</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{v.speed} km/h</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-transparent px-2 py-1 rounded text-center shadow-2xs">
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 block uppercase">Battery</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{v.batteryPct}%</span>
                  </div>

                  <div className="bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-transparent px-2 py-1 rounded text-center shadow-2xs">
                    <span className="text-[9px] text-gray-400 dark:text-slate-500 block uppercase">Heading</span>
                    <span className="font-bold text-gray-800 dark:text-slate-200">{v.heading}°</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
