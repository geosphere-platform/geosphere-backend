"use client";

import React, { useState } from "react";

export type BaseTileLayerType = "street" | "dark" | "satellite";

interface MapLayerSwitcherProps {
  activeLayer: BaseTileLayerType;
  onChangeLayer: (layer: BaseTileLayerType) => void;
  isVehicleLayerVisible: boolean;
  onToggleVehicleLayer: () => void;
  isClusterEnabled: boolean;
  onToggleCluster: () => void;
}

export const MapLayerSwitcher: React.FC<MapLayerSwitcherProps> = ({
  activeLayer,
  onChangeLayer,
  isVehicleLayerVisible,
  onToggleVehicleLayer,
  isClusterEnabled,
  onToggleCluster,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-3 left-3 z-10 text-xs">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Layer controls and switcher"
        aria-expanded={isOpen}
        className="flex items-center space-x-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <svg
          className="w-4 h-4 text-blue-600 dark:text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.82V8.046a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <span>Layers & Map Modes</span>
      </button>

      {isOpen && (
        <div className="mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-3 space-y-3 text-left">
          {/* Base Map Select */}
          <div>
            <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1.5">
              Base Map Layer
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => onChangeLayer("street")}
                className={`py-1 px-2 rounded font-semibold text-[11px] transition-colors ${
                  activeLayer === "street"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Street
              </button>
              <button
                type="button"
                onClick={() => onChangeLayer("dark")}
                className={`py-1 px-2 rounded font-semibold text-[11px] transition-colors ${
                  activeLayer === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => onChangeLayer("satellite")}
                className={`py-1 px-2 rounded font-semibold text-[11px] transition-colors ${
                  activeLayer === "satellite"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                Sat
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Layer Visibility Toggles */}
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Layer Visibility
            </span>
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isVehicleLayerVisible}
                onChange={onToggleVehicleLayer}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200">
                Vehicle Markers
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isClusterEnabled}
                onChange={onToggleCluster}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-slate-700 dark:text-slate-200">
                Marker Clustering
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
