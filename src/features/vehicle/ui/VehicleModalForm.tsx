"use client";

import React, { useState, useEffect } from "react";
import { VehicleItem, VehicleType, VehicleStatus } from "./vehicle-types";

interface VehicleModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<VehicleItem>) => Promise<boolean>;
  initialData?: VehicleItem | null;
  mode: "create" | "edit";
}

export const VehicleModalForm: React.FC<VehicleModalFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}) => {
  const [name, setName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [type, setType] = useState<VehicleType>("truck");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [status, setStatus] = useState<VehicleStatus>("active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData && mode === "edit") {
      setName(initialData.name || "");
      setLicensePlate(initialData.licensePlate || "");
      setType(initialData.type || "truck");
      setDriverName(initialData.driverName || "");
      setDriverPhone(initialData.driverPhone || "");
      setMake(initialData.make || "");
      setModel(initialData.model || "");
      setStatus(initialData.status || "active");
    } else {
      setName("");
      setLicensePlate("");
      setType("truck");
      setDriverName("");
      setDriverPhone("");
      setMake("");
      setModel("");
      setStatus("active");
    }
    setFormError(null);
  }, [initialData, mode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Vehicle name is required.");
      return;
    }

    if (!licensePlate.trim()) {
      setFormError("License plate is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<VehicleItem> = {
        name: name.trim(),
        licensePlate: licensePlate.trim().toUpperCase(),
        type,
        driverName: driverName.trim() || null,
        driverPhone: driverPhone.trim() || null,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        status,
      };

      const success = await onSubmit(payload);
      if (success) {
        onClose();
      } else {
        setFormError("Failed to save vehicle. Please try again.");
      }
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
        className="relative bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl z-50 text-gray-900 dark:text-white overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors"
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between bg-gray-50/80 dark:bg-slate-950/60">
          <div>
            <h2 id="modal-headline" className="text-base font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Register New Vehicle" : "Edit Vehicle Details"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {mode === "create"
                ? "Add a vehicle to your fleet registry with tracking configuration."
                : `Update operational specs for ${initialData?.licensePlate || "vehicle"}.`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/40 rounded-xl text-red-600 dark:text-red-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {/* Row 1: Name & License Plate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Vehicle Name <span className="text-blue-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nagpur Express Truck #1"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                License Plate <span className="text-blue-500">*</span>
              </label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                placeholder="e.g. MH-31-FA-1001"
                required
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase"
              />
            </div>
          </div>

          {/* Row 2: Vehicle Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Vehicle Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as VehicleType)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="truck" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Heavy Truck (🚚)</option>
                <option value="van" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Delivery Van (🚐)</option>
                <option value="hauler" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Heavy Hauler (🚛)</option>
                <option value="container" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Container Carrier (📦)</option>
                <option value="refrigerated" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Cold Chain / Pharma (❄️)</option>
                <option value="pickup" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Utility Pickup (🛻)</option>
                <option value="bus" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Transit Bus (🚌)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Initial Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as VehicleStatus)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="active" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Active (On Duty)</option>
                <option value="idle" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Idle (Parked / Standby)</option>
                <option value="maintenance" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Maintenance</option>
                <option value="offline" className="bg-white dark:bg-slate-900 text-gray-900 dark:text-white">Offline / Inactive</option>
              </select>
            </div>
          </div>

          {/* Row 3: Driver Name & Driver Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Assigned Driver
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                placeholder="e.g. Rajesh Sharma"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Driver Phone
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="+91 98230 11001"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Row 4: Make & Model */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Manufacturer / Make
              </label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Tata, Volvo, Ashok Leyland"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Prima 4028.S, FMX 460"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-700/80 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors disabled:opacity-50"
            >
              {isSubmitting && (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <span>{mode === "create" ? "Register Vehicle" : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
