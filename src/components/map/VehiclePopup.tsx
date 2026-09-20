"use client";

import React from "react";
import { MapVehicleMarker } from "@/features/dashboard/types/fleet";

interface VehiclePopupProps {
  marker: MapVehicleMarker | null;
  onClose: () => void;
  onZoomToVehicle: (marker: MapVehicleMarker) => void;
}

export const VehiclePopup: React.FC<VehiclePopupProps> = ({
  marker,
  onClose,
  onZoomToVehicle,
}) => {
  if (!marker) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xl w-64 text-left text-xs space-y-2.5">
      <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
            {marker.name}
          </h4>
          <span className="font-mono text-[11px] text-slate-500 block">
            {marker.licensePlate}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close popup"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <span className="text-slate-400 block">Status</span>
          <span className="font-semibold capitalize text-emerald-600 dark:text-emerald-400">
            {marker.status}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">Speed</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {marker.speed} km/h
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">Driver</span>
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
            {marker.driverName}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">Updated</span>
          <span className="text-slate-500 truncate block">
            {marker.lastUpdated}
          </span>
        </div>
      </div>

      <div className="pt-1">
        <button
          type="button"
          onClick={() => onZoomToVehicle(marker)}
          className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            />
          </svg>
          Zoom to Vehicle
        </button>
      </div>
    </div>
  );
};
