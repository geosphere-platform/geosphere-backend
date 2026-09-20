"use client";

import React from "react";
import Link from "next/link";
import { VehicleItem } from "./vehicle-types";

interface VehicleDataTableProps {
  vehicles: VehicleItem[];
  onSelectVehicle: (vehicle: VehicleItem) => void;
  onEditVehicle: (vehicle: VehicleItem) => void;
  onDeleteVehicle: (vehicle: VehicleItem) => void;
  onResetFilters?: () => void;
}

export const VehicleDataTable: React.FC<VehicleDataTableProps> = ({
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
    <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl overflow-hidden mb-8 transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-gray-700 dark:text-slate-300">
          <thead className="bg-gray-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-800 font-semibold">
            <tr>
              <th className="py-3.5 px-4">Vehicle</th>
              <th className="py-3.5 px-4">License Plate</th>
              <th className="py-3.5 px-4">Driver</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Speed</th>
              <th className="py-3.5 px-4">Power / Fuel</th>
              <th className="py-3.5 px-4">Last Reported</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-800/60 font-medium">
            {vehicles.map((v) => {
              const isMoving = v.status === "moving";
              const isIdle = v.status === "idle";
              const isMaintenance = v.status === "maintenance";

              return (
                <tr
                  key={v.id}
                  className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectVehicle(v)}
                >
                  {/* Vehicle Name & Type */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">
                        {v.type === "truck"
                          ? "🚚"
                          : v.type === "hauler"
                            ? "🚛"
                            : v.type === "van"
                              ? "🚐"
                              : v.type === "refrigerated"
                                ? "❄️"
                                : v.type === "bus"
                                  ? "🚌"
                                  : v.type === "container"
                                    ? "📦"
                                    : "🛻"}
                      </span>
                      <div>
                        <span className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block line-clamp-1">
                          {v.name}
                        </span>
                        {v.make && (
                          <span className="text-[10px] text-gray-500 dark:text-slate-500">
                            {v.make} {v.model}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* License Plate */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-950 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                      {v.licensePlate}
                    </span>
                  </td>

                  {/* Driver */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-slate-200 font-medium">
                        {v.driverName || "Unassigned"}
                      </span>
                      {v.driverPhone && (
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 font-mono">
                          {v.driverPhone}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 ${
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
                  </td>

                  {/* Speed */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-gray-900 dark:text-white">
                    {v.speed ?? 0} <span className="text-[10px] text-gray-500 dark:text-slate-500 font-normal">km/h</span>
                  </td>

                  {/* Power / Fuel */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-[11px] font-mono">
                      <span title="Battery Level" className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ⚡ {v.batteryPct ?? "--"}%
                      </span>
                      <span className="text-gray-300 dark:text-slate-600">|</span>
                      <span title="Fuel Level" className="text-amber-600 dark:text-amber-400 font-semibold">
                        ⛽ {v.fuelPct ?? "--"}%
                      </span>
                    </div>
                  </td>

                  {/* Last Reported */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="text-gray-700 dark:text-slate-300 text-[11px]">
                        {v.lastUpdated || "Recently"}
                      </span>
                      {v.currentAddress && (
                        <span className="text-[10px] text-gray-500 dark:text-slate-500 truncate max-w-xs">
                          {v.currentAddress}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Actions */}
                  <td
                    className="py-3.5 px-4 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Track */}
                      <Link
                        href={`/dashboard/tracking?vehicleId=${encodeURIComponent(v.id)}`}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 hover:border-blue-600 dark:bg-blue-600/20 dark:hover:bg-blue-600 dark:text-blue-300 dark:hover:text-white dark:border-blue-500/30 rounded-lg text-xs font-semibold transition-colors"
                        title="Live Track on Map"
                      >
                        Track
                      </Link>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => onEditVehicle(v)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Edit Vehicle"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => onDeleteVehicle(v)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Vehicle"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
