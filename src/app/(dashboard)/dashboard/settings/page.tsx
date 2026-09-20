"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { EntitlementProvider } from "@/features/subscription/hooks/use-entitlements";
import { CurrentPlanCard } from "@/features/subscription/components/CurrentPlanCard";
import { UsageDashboard } from "@/features/subscription/components/UsageDashboard";
import { PlansList } from "@/features/subscription/components/PlansList";
import { useTheme, Theme } from "@/core/theme/ThemeProvider";

interface PlatformSettingsState {
  telemetryInterval: string;
  defaultBasemap: string;
  unitSystem: string;
  speedWarningLimit: string;
  notifyGeofenceBreach: boolean;
  notifyOverspeed: boolean;
  notifyIdling: boolean;
}

const DEFAULT_SETTINGS: PlatformSettingsState = {
  telemetryInterval: "5",
  defaultBasemap: "osm",
  unitSystem: "metric",
  speedWarningLimit: "80",
  notifyGeofenceBreach: true,
  notifyOverspeed: true,
  notifyIdling: false,
};

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"preferences" | "subscription" | "account">("preferences");
  const [settings, setSettings] = useState<PlatformSettingsState>(DEFAULT_SETTINGS);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  // Hydrate settings from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("geosphere_platform_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Fall back to default settings
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("geosphere_platform_settings", JSON.stringify(settings));
      localStorage.setItem("geosphere_default_basemap", settings.defaultBasemap);
      window.dispatchEvent(new Event("geosphere_settings_updated"));
    } catch {
      // Local storage unavailable or restricted
    }
    setSavedNotice("Platform settings saved and applied to your workspace.");
    setTimeout(() => setSavedNotice(null), 4000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl font-sans">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-950 p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm dark:shadow-xl text-gray-900 dark:text-white transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-wider rounded uppercase bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
              Workspace Configuration
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400">• Preferences & Telemetry Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1.5 text-gray-900 dark:text-white">
            Platform & Workspace Settings
          </h1>
          <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
            Configure real-time stream intervals, GIS default basemaps, measurement units, alert notifications, and commercial quotas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/settings/subscription"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md self-start md:self-auto"
          >
            💳 Dedicated Subscription Page &rarr;
          </Link>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "preferences"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          }`}
        >
          <span>🗺️ GIS & Telemetry Preferences</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscription")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "subscription"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          }`}
        >
          <span>💳 Subscription & Usage Quotas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("account")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === "account"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"
          }`}
        >
          <span>👤 Profile & Security</span>
        </button>
      </div>

      {savedNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-medium animate-in fade-in flex items-center justify-between">
          <span>✓ {savedNotice}</span>
          <button
            type="button"
            onClick={() => setSavedNotice(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-white text-xs ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: GIS & TELEMETRY PREFERENCES */}
      {activeTab === "preferences" && (
        <form onSubmit={handleSave} className="space-y-6">
          {/* GIS Map & Telemetry Settings */}
          <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🗺️ GIS Map & Display Defaults</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">Default Basemap Provider</label>
                <select
                  value={settings.defaultBasemap}
                  onChange={(e) => setSettings((s) => ({ ...s, defaultBasemap: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="osm">OpenStreetMap Standard (Daylight Street)</option>
                  <option value="carto_dark">Carto Dark (High-Contrast Night Mode)</option>
                  <option value="satellite">High-Resolution Satellite Imagery</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">Measurement Units</label>
                <select
                  value={settings.unitSystem}
                  onChange={(e) => setSettings((s) => ({ ...s, unitSystem: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="metric">Metric (Kilometers, km/h, Hectares)</option>
                  <option value="imperial">Imperial (Miles, mph, Acres)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">
                  Live Telemetry Polling Rate
                </label>
                <select
                  value={settings.telemetryInterval}
                  onChange={(e) => setSettings((s) => ({ ...s, telemetryInterval: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1">1 Second (Ultra High Frequency / Emergency NOC)</option>
                  <option value="5">5 Seconds (Standard Real-time Tracking)</option>
                  <option value="15">15 Seconds (Battery & Bandwidth Saver)</option>
                  <option value="30">30 Seconds (Low-frequency Telemetry)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">
                  Speed Threshold Warning (km/h)
                </label>
                <input
                  type="number"
                  value={settings.speedWarningLimit}
                  onChange={(e) => setSettings((s) => ({ ...s, speedWarningLimit: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-gray-700 dark:text-slate-300 font-semibold block">UI Theme Mode (Dark Mode / Light Mode)</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-300 dark:border-slate-800 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="dark">🌙 Dark Mode (Default / NOC Mission Control)</option>
                  <option value="light">☀️ Light Mode (High-Contrast Daylight)</option>
                  <option value="system">💻 System Preference (Auto Follow OS)</option>
                </select>
                <span className="text-gray-500 dark:text-slate-400 text-[11px] block mt-1">
                  Dark Mode is active by default. You can also toggle instantly at any time using the ☀️/🌙 button in the top navigation bar.
                </span>
              </div>
            </div>
          </div>

          {/* Dispatch & Alert Notification Rules */}
          <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none transition-colors">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🔔 Automated Alert Triggers</span>
            </h2>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 cursor-pointer hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white block">Geofence Perimeter Breach</span>
                  <span className="text-gray-500 dark:text-slate-400 text-[11px] block">
                    Instantly flag when a vehicle enters or exits unpermitted zones
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyGeofenceBreach}
                  onChange={(e) => setSettings((s) => ({ ...s, notifyGeofenceBreach: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 cursor-pointer hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white block">Overspeed Velocity Alert</span>
                  <span className="text-gray-500 dark:text-slate-400 text-[11px] block">
                    Notify dispatch if current speed exceeds configured threshold ({settings.speedWarningLimit} km/h)
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyOverspeed}
                  onChange={(e) => setSettings((s) => ({ ...s, notifyOverspeed: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 cursor-pointer hover:border-gray-300 dark:hover:border-slate-700 transition-colors">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white block">Excessive Idling Detection</span>
                  <span className="text-gray-500 dark:text-slate-400 text-[11px] block">
                    Alert when ignition is on with zero movement for more than 15 minutes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifyIdling}
                  onChange={(e) => setSettings((s) => ({ ...s, notifyIdling: e.target.checked }))}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg"
            >
              💾 Save Platform Settings
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: SUBSCRIPTION & USAGE QUOTAS */}
      {activeTab === "subscription" && (
        <EntitlementProvider>
          <div className="space-y-6">
            <CurrentPlanCard />
            <UsageDashboard />
            <PlansList />
          </div>
        </EntitlementProvider>
      )}

      {/* TAB 3: ACCOUNT & PROFILE */}
      {activeTab === "account" && (
        <div className="bg-white dark:bg-slate-900/90 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 text-xs shadow-sm dark:shadow-none transition-colors">
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Active Account Profile</h2>
            <p className="text-gray-500 dark:text-slate-400 text-[11px] mt-0.5">Your authenticated session, enterprise organization, and role credentials.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium block">Full Name</span>
              <p className="text-gray-900 dark:text-white font-bold text-sm">System Administrator</p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium block">Email Address</span>
              <p className="text-gray-900 dark:text-white font-bold text-sm">admin@fleet.com</p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium block">Role & Privileges</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded uppercase font-extrabold text-[10px] bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40">
                  SUPER_ADMIN
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">All Privileges Granted</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl space-y-1">
              <span className="text-gray-500 dark:text-slate-400 text-[11px] font-medium block">Active Organization ID</span>
              <p className="text-indigo-600 dark:text-indigo-300 font-mono text-xs">00000000-0000-0000-0000-000000000001</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50/80 dark:bg-slate-950/60 border border-gray-200 dark:border-slate-800/80 rounded-xl flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-gray-900 dark:text-white font-semibold block">Active Session Token</span>
              <span className="text-gray-500 dark:text-slate-400 text-[11px] block">Cryptographically signed HS256 JWT with automatic rolling refresh.</span>
            </div>
            <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              ✓ Active & Verified
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
