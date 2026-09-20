"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { VehicleItem, VehicleStatus } from "./vehicle-types";

interface VehicleDetailsDrawerProps {
  vehicle: VehicleItem | null;
  onClose: () => void;
  onEdit: (vehicle: VehicleItem) => void;
  onStatusChange: (id: string, newStatus: VehicleStatus) => void;
}

export const VehicleDetailsDrawer: React.FC<VehicleDetailsDrawerProps> = ({
  vehicle,
  onClose,
  onEdit,
  onStatusChange,
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!vehicle) return null;

  const isMoving = vehicle.status === "moving";
  const isIdle = vehicle.status === "idle";
  const isMaintenance = vehicle.status === "maintenance";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col h-full text-gray-900 dark:text-white overflow-y-auto animate-in slide-in-from-right duration-200 transition-colors"
        aria-label="Vehicle Details"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-start justify-between bg-gray-50/80 dark:bg-slate-950/60 sticky top-0 z-10 backdrop-blur-md">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200">
                {vehicle.licensePlate}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
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
                {vehicle.status}
              </span>
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white line-clamp-1">
              {vehicle.name}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 rounded-xl transition-colors"
            title="Close Drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-5 space-y-5 flex-1">
          {/* Primary Action: Live Tracking Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-900/10 to-indigo-900/10 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-500/30 dark:border-blue-500/40 shadow-md dark:shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-300">
                Live Telemetry
              </span>
              <span className="text-[11px] text-gray-500 dark:text-slate-400">
                {vehicle.lastUpdated || "Live"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                  Speed
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                  {vehicle.speed ?? 0} km/h
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                  Battery
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  {vehicle.batteryPct ?? "--"}%
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-gray-500 dark:text-slate-400 block">
                  Fuel/Charge
                </span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400 font-mono">
                  {vehicle.fuelPct ?? "--"}%
                </span>
              </div>
            </div>

            <Link
              href={`/dashboard/tracking?vehicleId=${encodeURIComponent(vehicle.id)}`}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-md transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Track on Live GIS Map</span>
            </Link>
          </div>

          {/* Location Details */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Current Location & Coordinates
            </h3>
            <div className="bg-gray-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs space-y-2">
              <p className="text-gray-800 dark:text-slate-200 font-medium">
                📍 {vehicle.currentAddress || "Central Logistics Yard, Nagpur"}
              </p>
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-slate-400 pt-2 border-t border-gray-200 dark:border-slate-800/80 font-mono">
                <span>Lat: {vehicle.latitude?.toFixed(4) ?? "21.1458"}</span>
                <span>Lon: {vehicle.longitude?.toFixed(4) ?? "79.0882"}</span>
                <span>Heading: {vehicle.heading ?? 0}°</span>
              </div>
            </div>
          </div>

          {/* Driver Information */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Assigned Driver
            </h3>
            <div className="bg-gray-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-900 dark:text-white text-sm">
                  👤 {vehicle.driverName || "Unassigned"}
                </span>
                {vehicle.driverPhone && (
                  <a
                    href={`tel:${vehicle.driverPhone}`}
                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-colors"
                  >
                    📞 Call Driver
                  </a>
                )}
              </div>
              {vehicle.driverLicense && (
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  License: <span className="font-mono text-gray-700 dark:text-slate-300">{vehicle.driverLicense}</span>
                </p>
              )}
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Vehicle Specifications
            </h3>
            <div className="bg-gray-50 dark:bg-slate-950/70 p-3.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs divide-y divide-gray-200 dark:divide-slate-800/80">
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-slate-400">Make & Model</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {vehicle.make} {vehicle.model}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-slate-400">Manufacturing Year</span>
                <span className="font-medium text-gray-900 dark:text-white">{vehicle.year || "2023"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-slate-400">Fuel / Powertrain</span>
                <span className="font-medium text-gray-900 dark:text-white">{vehicle.fuelType || "Diesel"}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-slate-400">Odometer</span>
                <span className="font-mono font-medium text-gray-900 dark:text-white">
                  {vehicle.odometerKm?.toLocaleString() ?? "--"} km
                </span>
              </div>
              {vehicle.vin && (
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-slate-400">VIN / Chassis</span>
                  <span className="font-mono text-gray-700 dark:text-slate-300">{vehicle.vin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Status Control */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400">
              Operational Status Control
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onStatusChange(vehicle.id, "active")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  vehicle.status === "active" || vehicle.status === "moving"
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm"
                    : "bg-gray-100 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(vehicle.id, "idle")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  vehicle.status === "idle"
                    ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300 shadow-sm"
                    : "bg-gray-100 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Idle
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(vehicle.id, "maintenance")}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                  vehicle.status === "maintenance"
                    ? "bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300 shadow-sm"
                    : "bg-gray-100 dark:bg-slate-950 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Maintenance
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-950/60 sticky bottom-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onEdit(vehicle)}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Vehicle</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-300 font-semibold rounded-xl text-xs border border-gray-300 dark:border-slate-700/80 transition-colors"
          >
            Close
          </button>
        </div>
      </aside>
    </div>
  );
};
