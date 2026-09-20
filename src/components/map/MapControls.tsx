"use client";

import React from "react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToExtent: () => void;
  onLocateMe: () => void;
  onToggleFullscreen: () => void;
}

export const MapControls: React.FC<MapControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onZoomToExtent,
  onLocateMe,
  onToggleFullscreen,
}) => {
  return (
    <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Zoom in"
        title="Zoom in"
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        +
      </button>
      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Zoom out"
        title="Zoom out"
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        -
      </button>

      <div className="h-px bg-slate-200 dark:bg-slate-800 my-0.5" />

      <button
        type="button"
        onClick={onZoomToExtent}
        aria-label="Zoom to fit all vehicles"
        title="Zoom to all vehicles"
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onLocateMe}
        aria-label="Find current location"
        title="My Location"
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
      >
        🎯
      </button>

      <button
        type="button"
        onClick={onToggleFullscreen}
        aria-label="Toggle fullscreen mode"
        title="Fullscreen"
        className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-center"
      >
        ⛶
      </button>
    </div>
  );
};
