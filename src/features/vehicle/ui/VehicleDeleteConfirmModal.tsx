"use client";

import React, { useState } from "react";
import { VehicleItem } from "./vehicle-types";

interface VehicleDeleteConfirmModalProps {
  vehicle: VehicleItem | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export const VehicleDeleteConfirmModal: React.FC<VehicleDeleteConfirmModalProps> = ({
  vehicle,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!vehicle) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onConfirm(vehicle.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl z-50 text-gray-900 dark:text-white p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 transition-colors">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xl">
          🗑️
        </div>

        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Retire Vehicle</h3>
          <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
            Are you sure you want to retire and remove{" "}
            <span className="font-semibold text-gray-900 dark:text-white">{vehicle.name}</span> (
            <span className="font-mono text-gray-700 dark:text-slate-200">{vehicle.licensePlate}</span>
            ) from your active fleet registry? This will unlink active tracking.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
          >
            {isDeleting && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Delete Vehicle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
