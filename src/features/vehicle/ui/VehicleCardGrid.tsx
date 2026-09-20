"use client";

import React from "react";
import Link from "next/link";
import { VehicleItem, VehicleType } from "./vehicle-types";

interface VehicleCardGridProps {
  vehicles: VehicleItem[];
  onSelectVehicle: (vehicle: VehicleItem) => void;
  onEditVehicle: (vehicle: VehicleItem) => void;
  onDeleteVehicle: (vehicle: VehicleItem) => void;
  onResetFilters?: () => void;
}

function renderVehicleTypeIcon(type: VehicleType) {
  switch (type) {
    case "truck":
      return (
        <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20" title="Heavy Truck">
          🚚
        </span>
      );
    case "hauler":
      return (
        <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Heavy Hauler">
          🚛
        </span>
      );
    case "van":
      return (
        <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Delivery Van">
          🚐
        </span>
      );
    case "refrigerated":
      return (
        <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" title="Refrigerated Cold Chain">
          ❄️
        </span>
      );
    case "bus":
      return (
        <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Transit Bus">
          🚌
        </span>
      );
    case "container":
      return (
        <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Inter-State Container">
          📦
        </span>
      );
    case "pickup":
    default:
      return (
        <span className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20" title="Utility Pickup">
          🛻
        </span>
      );
  }
}

export const VehicleCardGrid: React.FC<VehicleCardGridProps> = ({
  vehicles,
  onSelectVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onResetFilters,
}) => {
  if (vehicles.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto my-8 space-y-4 shadow-sm dark:shadow-xl transition-colors">
        <div className="w-14 h-14 mx-auto rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-400 dark:text-slate-400 text-2xl">
          🔍
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-white">No vehicles found</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">
          No vehicles matched your current filter criteria or search query.
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
          >
            Reset Filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
      {vehicles.map((v) => {
        const isMoving = v.status === "moving";
        const isIdle = v.status === "idle";
        const isMaintenance = v.status === "maintenance";

        return (
          <div
            key={v.id}
            className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800/90 hover:border-blue-400 dark:hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/40 flex flex-col justify-between group text-gray-900 dark:text-white"
          >
            {/* Card Header: Type Icon, Name & Status Badge */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {renderVehicleTypeIcon(v.type)}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {v.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                        {v.licensePlate}
                      </span>
                      {v.make && (
                        <span className="text-[11px] text-gray-500 dark:text-slate-400 truncate">
                          {v.make} {v.model}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shrink-0 ${
                    isMoving
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : isIdle
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : isMaintenance
                          ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                          : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 border border-gray-200 dark:border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isMoving
                        ? "bg-emerald-500 dark:bg-emerald-400 animate-ping"
                        : isIdle
                          ? "bg-amber-500 dark:bg-amber-400"
                          : isMaintenance
                            ? "bg-purple-500 dark:bg-purple-400"
                            : "bg-gray-400 dark:bg-slate-500"
                    }`}
                  />
                  {v.status}
                </span>
              </div>

              {/* Driver & Last Update Row */}
              <div className="flex items-center justify-between text-xs text-gray-700 dark:text-slate-300 py-2 border-t border-gray-100 dark:border-slate-800/80">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-gray-500 dark:text-slate-400">Driver:</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {v.driverName || "Unassigned"}
                  </span>
                </div>
                <span className="text-[11px] text-gray-400 dark:text-slate-500 shrink-0">
                  {v.lastUpdated || "Recently"}
                </span>
              </div>

              {/* Quick Telemetry Grid */}
              <div className="grid grid-cols-4 gap-2 py-2.5 my-1 bg-gray-50 dark:bg-slate-950/60 rounded-xl px-3 border border-gray-200/80 dark:border-slate-800/60 text-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-500 block font-semibold">
                    Speed
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                    {v.speed ?? 0} <span className="text-[9px] text-gray-500 dark:text-slate-400 font-normal">km/h</span>
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-500 block font-semibold">
                    Battery
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                    {v.batteryPct ?? "--"}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-500 block font-semibold">
                    Fuel/Charge
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white font-mono">
                    {v.fuelPct ?? "--"}%
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-500 block font-semibold">
                    Odometer
                  </span>
                  <span className="text-xs font-bold text-gray-900 dark:text-white font-mono truncate">
                    {v.odometerKm ? `${Math.round(v.odometerKm / 1000)}k` : "--"}
                  </span>
                </div>
              </div>

              {/* Location Snippet */}
              {v.currentAddress && (
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-slate-400 mt-2 line-clamp-1">
                  <span className="shrink-0 text-gray-400 dark:text-slate-500">📍</span>
                  <span className="truncate">{v.currentAddress}</span>
                </div>
              )}
            </div>

            {/* Action Bar Footer */}
            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-slate-800/80">
              {/* Live Track CTA */}
              <Link
                href={`/dashboard/tracking?vehicleId=${encodeURIComponent(v.id)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 dark:bg-blue-600/20 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white dark:border-blue-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm active:scale-95"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Live Track</span>
              </Link>

              {/* Secondary Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelectVehicle(v)}
                  className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white rounded-lg text-xs font-medium transition-colors"
                  title="View vehicle details"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => onEditVehicle(v)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Edit vehicle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteVehicle(v)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete vehicle"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
