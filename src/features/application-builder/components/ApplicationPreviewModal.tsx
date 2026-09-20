"use client";

import React, { useState } from "react";
import { ApplicationConfig } from "../types/application.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ApplicationConfig;
  appName: string;
}

export const ApplicationPreviewModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  appName,
}) => {
  const [viewMode, setViewMode] = useState<"WEB" | "MOBILE">("WEB");

  if (!isOpen) return null;

  const branding = config.branding || {
    appTitle: appName,
    primaryColor: "#0F172A",
    accentColor: "#3B82F6",
    darkMode: true,
  };

  const modules = config.modules || [];
  const layers = config.layers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-gray-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: branding.accentColor || "#3B82F6" }}
            />
            <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
              {branding.appTitle || appName} — Live Preview
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode("WEB")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "WEB"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              Web App
            </button>
            <button
              onClick={() => setViewMode("MOBILE")}
              className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                viewMode === "MOBILE"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
            >
              Mobile View
            </button>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white text-xl font-bold"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto flex justify-center bg-gray-50/50 dark:bg-slate-950/50">
          {viewMode === "WEB" ? (
            /* Web View Simulation */
            <div className="w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg p-6 space-y-6 shadow-sm">
              <header
                className="p-4 rounded-md flex items-center justify-between text-white shadow-md"
                style={{ backgroundColor: branding.primaryColor || "#0F172A" }}
              >
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-lg">{branding.appTitle}</span>
                </div>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-mono">
                  PUBLISHED CONFIG
                </span>
              </header>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-md p-4 min-h-[260px] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                  <p className="text-gray-600 dark:text-slate-400 text-sm font-mono z-10">
                    Map Viewport Preview (
                    {config.mapConfig?.defaultStyle || "STREETS"})
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 z-10">
                    Center: [{config.mapConfig?.initialCenter?.join(", ")}] |
                    Zoom: {config.mapConfig?.zoom}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-md p-4">
                  <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Active Layers ({layers.length})
                  </h4>
                  <ul className="space-y-2 text-xs">
                    {layers.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded border border-gray-200 dark:border-transparent"
                      >
                        <span className="text-gray-800 dark:text-slate-200">{l.name}</span>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                          {l.geometryType}
                        </span>
                      </li>
                    ))}
                    {layers.length === 0 && (
                      <li className="text-gray-400 dark:text-slate-500 italic">
                        No custom layers configured
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Enabled Modules ({modules.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {modules.map((m) => (
                    <span
                      key={m}
                      className="px-2.5 py-1 rounded bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-800 dark:text-slate-200 text-xs font-mono"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Mobile Frame Simulation */
            <div className="w-[340px] h-[640px] bg-gray-900 border-4 border-gray-300 dark:border-slate-700 rounded-[36px] shadow-2xl p-4 flex flex-col relative overflow-hidden">
              {/* Notch */}
              <div className="w-32 h-4 bg-gray-700 dark:bg-slate-800 rounded-b-xl mx-auto mb-3" />
              <div
                className="p-3 rounded-lg flex items-center justify-between text-white mb-3"
                style={{ backgroundColor: branding.primaryColor || "#0F172A" }}
              >
                <span className="font-semibold text-sm">
                  {branding.appTitle}
                </span>
                <span className="text-[10px] text-emerald-400">Online</span>
              </div>
              <div className="flex-1 bg-slate-900 rounded-lg p-3 border border-slate-800 flex flex-col justify-between">
                <div className="bg-slate-950 h-40 rounded flex items-center justify-center border border-slate-800 text-xs text-slate-500">
                  Mobile Map Overlay
                </div>
                <div className="space-y-1.5 mt-3">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Enabled Features
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
                    {modules.slice(0, 6).map((m) => (
                      <div
                        key={m}
                        className="bg-slate-950 p-1.5 rounded border border-slate-800 text-center font-mono"
                      >
                        {m}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-sm font-medium rounded-md transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
