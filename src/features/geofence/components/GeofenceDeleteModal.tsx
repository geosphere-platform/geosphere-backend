"use client";

import React from "react";
import { GeofenceZoneItem } from "../types";

export interface GeofenceDeleteModalProps {
  zone: GeofenceZoneItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const GeofenceDeleteModal: React.FC<GeofenceDeleteModalProps> = ({
  zone,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !zone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl text-gray-900 dark:text-white font-sans space-y-4 transition-colors">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 flex items-center justify-center text-lg flex-shrink-0">
            ⚠️
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Delete Virtual Boundary?</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-800 text-xs space-y-1">
          <p className="text-gray-900 dark:text-slate-300 font-semibold">{zone.name}</p>
          <p className="text-gray-500 dark:text-slate-400 text-[11px]">
            {zone.activeVehiclesCount > 0
              ? `Warning: ${zone.activeVehiclesCount} vehicles are currently inside this zone!`
              : "No vehicles are currently inside this boundary."}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(zone.id)}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md hover:shadow-red-500/25 transition-all"
          >
            Delete Zone
          </button>
        </div>
      </div>
    </div>
  );
};
