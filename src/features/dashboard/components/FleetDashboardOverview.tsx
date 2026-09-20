"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { UserProfile } from "../types";
import { useFleetDashboard } from "../hooks/useFleetDashboard";
import { useFleetMapData } from "../hooks/useFleetMapData";
import { KpiGrid } from "./kpi/KpiGrid";
import MapView from "@/components/map/MapView";
import { RecentAlertsWidget } from "./widgets/RecentAlertsWidget";
import { RecentTripsWidget } from "./widgets/RecentTripsWidget";
import { VehicleStatusWidget } from "./widgets/VehicleStatusWidget";
import { SystemEventsWidget } from "./widgets/SystemEventsWidget";

interface FleetDashboardOverviewProps {
  user: UserProfile;
}

export const FleetDashboardOverview: React.FC<FleetDashboardOverviewProps> = ({
  user,
}) => {
  const dashboard = useFleetDashboard();
  const mapData = useFleetMapData();

  // Full-Screen state management
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);
  const [isKpiBarOpen, setIsKpiBarOpen] = useState(false);
  const [autoRefreshSec, setAutoRefreshSec] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState("");

  // Real-time digital clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh interval handler
  useEffect(() => {
    if (autoRefreshSec <= 0) return;
    const interval = setInterval(() => {
      dashboard.refetch();
      mapData.refetchPositions();
    }, autoRefreshSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSec, dashboard, mapData]);

  // Fullscreen API synchronization & Escape key handler
  useEffect(() => {
    const onFullscreenChange = () => {
      const isApiFullscreen = !!document.fullscreenElement;
      if (!isApiFullscreen && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        setIsFullScreen(false);
      }
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isFullScreen]);

  // Toggle fullscreen mode
  const handleToggleFullscreen = useCallback(() => {
    if (!isFullScreen) {
      setIsFullScreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullScreen(false);
    }
  }, [isFullScreen]);

  // Derived metrics for Fullscreen HUD
  const totalVehicles =
    dashboard.kpis.find((k) => k.id === "total")?.value ??
    mapData.markers.length;
  const movingCount =
    dashboard.kpis.find((k) => k.id === "moving")?.value ??
    mapData.markers.filter((m) => m.status === "moving").length;
  const idleCount =
    dashboard.kpis.find((k) => k.id === "idle")?.value ??
    mapData.markers.filter((m) => m.status === "idle").length;
  const offlineCount =
    dashboard.kpis.find((k) => k.id === "offline")?.value ??
    mapData.markers.filter((m) => m.status === "offline").length;
  const criticalAlerts = dashboard.alerts.filter(
    (a) => a.severity === "critical",
  ).length;

  // -------------------------------------------------------------
  // FULL-SCREEN MODE RENDER
  // -------------------------------------------------------------
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-[100] w-screen h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
        {/* Top Operational Command Center HUD */}
        <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 backdrop-blur-md select-none z-20">
          {/* Left: Brand / Mode & Digital Clock */}
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Command Center
            </span>

            <div className="hidden sm:flex items-center text-xs text-slate-300 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 mr-1.5">🕒</span>
              <span>{currentTime}</span>
            </div>

            {/* Quick Fleet Metrics Ticker */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Fleet: <strong className="text-white">{totalVehicles}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                Moving: <strong>{movingCount}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-400">
                Idle: <strong>{idleCount}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-400">
                Offline: <strong>{offlineCount}</strong>
              </span>
              {criticalAlerts > 0 && (
                <span className="px-2 py-0.5 rounded bg-red-950/60 border border-red-500/30 text-red-400 animate-pulse">
                  Alerts: <strong>{criticalAlerts}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Right: Operational Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Toggle KPI Strip */}
            <button
              type="button"
              onClick={() => setIsKpiBarOpen(!isKpiBarOpen)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
                isKpiBarOpen
                  ? "bg-blue-600 text-white border-blue-500"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              📊 KPIs
            </button>

            {/* Auto-refresh selector */}
            <select
              value={autoRefreshSec}
              onChange={(e) => setAutoRefreshSec(Number(e.target.value))}
              aria-label="Auto-refresh interval"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value={0}>Auto: OFF</option>
              <option value={10}>Auto: 10s</option>
              <option value={30}>Auto: 30s</option>
              <option value={60}>Auto: 60s</option>
            </select>

            {/* Refresh Data */}
            <button
              type="button"
              onClick={() => {
                dashboard.refetch();
                mapData.refetchPositions();
              }}
              title="Refresh telemetry"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <svg
                className={`w-3.5 h-3.5 ${dashboard.isLoading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Quick module links */}
            <Link
              href="/dashboard/tracking"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              🛰️ Tracking
            </Link>
            <Link
              href="/dashboard/vehicles"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              🚚 Vehicles
            </Link>
            <Link
              href="/dashboard/geofences"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              📍 Geofences
            </Link>

            {/* Exit Fullscreen */}
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              ✕ Exit Fullscreen
            </button>
          </div>
        </header>

        {/* Collapsible Top KPI Strip */}
        {isKpiBarOpen && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 flex-shrink-0 animate-in slide-in-from-top-2 duration-200 overflow-x-auto">
            <div className="min-w-[800px]">
              <KpiGrid
                kpis={dashboard.kpis}
                isLoading={dashboard.isLoading}
                isError={dashboard.isError}
                onRetry={dashboard.refetch}
              />
            </div>
          </div>
        )}

        {/* Main Workspace (Map + Side Panel) */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* GIS Map Canvas Column */}
          <main className="flex-1 flex flex-col h-full relative overflow-hidden">
            <MapView
              markers={mapData.markers}
              selectedMarker={mapData.selectedMarker}
              onSelectMarker={mapData.setSelectedMarker}
              isLoading={mapData.isLoading}
              onRetry={mapData.refetchPositions}
              heightClass="h-full"
              isFullScreen={true}
              onToggleFullScreen={handleToggleFullscreen}
            />

            {/* Floating Drawer Toggle on Top Right of Map */}
            <button
              type="button"
              onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
              className="absolute top-3 right-16 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-xl backdrop-blur-md transition-all flex items-center gap-1.5"
            >
              {isSidePanelOpen ? "◀ Hide Panels" : "▶ Show Panels"}
            </button>
          </main>

          {/* Collapsible Side Widgets Drawer */}
          {isSidePanelOpen && (
            <aside className="w-80 xl:w-96 h-full bg-slate-900/95 border-l border-slate-800 flex flex-col overflow-y-auto p-4 space-y-4 backdrop-blur-md z-10 animate-in slide-in-from-right-2 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Operations Feeds
                </h2>
                <span className="text-[11px] text-slate-500">Live Telemetry</span>
              </div>

              {/* Recent Alerts Widget */}
              <div className="space-y-1">
                <RecentAlertsWidget alerts={dashboard.alerts} />
              </div>

              {/* Recent Trips Widget */}
              <div className="space-y-1">
                <RecentTripsWidget trips={dashboard.trips} />
              </div>

              {/* Vehicle Status Breakdown */}
              <div className="space-y-1">
                <VehicleStatusWidget kpis={dashboard.kpis} />
              </div>

              {/* System Events Activity */}
              <div className="space-y-1">
                <SystemEventsWidget events={dashboard.events} />
              </div>
            </aside>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD DASHBOARD RENDER (When not in fullscreen)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-white via-slate-50 to-blue-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-md gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Fleet Operations Dashboard
          </h1>
          <p className="text-gray-500 dark:text-slate-300 text-xs mt-1">
            Logged in as{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {user.firstName} {user.lastName}
            </span>{" "}
            ({user.role}) | Real-time Operations Center
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Fullscreen Command Center Toggle */}
          <button
            type="button"
            onClick={handleToggleFullscreen}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            ⛶ Fullscreen Command Center
          </button>

          <Link
            href="/dashboard/tracking"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            🛰️ Live Tracking
          </Link>

          <Link
            href="/dashboard/vehicles"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            🚚 Vehicles
          </Link>

          <Link
            href="/dashboard/geofences"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold border border-gray-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
          >
            📍 Geofences
          </Link>

          <button
            type="button"
            onClick={() => {
              dashboard.refetch();
              mapData.refetchPositions();
            }}
            aria-label="Refresh dashboard data"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-white border border-gray-200 dark:border-transparent text-xs font-semibold backdrop-blur-md transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <svg
              className={`w-3.5 h-3.5 ${dashboard.isLoading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Data
          </button>
        </div>
      </div>

      {/* TOP SECTION: 8 KPI Cards */}
      <section aria-label="Key Performance Indicators">
        <KpiGrid
          kpis={dashboard.kpis}
          isLoading={dashboard.isLoading}
          isError={dashboard.isError}
          onRetry={dashboard.refetch}
        />
      </section>

      {/* MAIN GIS MAP SECTION & RIGHT WIDGETS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAP SECTION (Occupies 2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  GIS Fleet Map
                  <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                    OpenLayers GIS
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mapData.markers.length} vehicle markers loaded • Modular
                  OpenLayers Architecture
                </p>
              </div>

              {/* Quick Fullscreen Button directly above Map */}
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-slate-700"
              >
                ⛶ Fullscreen View
              </button>
            </div>

            {/* Modular OpenLayers GIS MapView */}
            <MapView
              markers={mapData.markers}
              selectedMarker={mapData.selectedMarker}
              onSelectMarker={mapData.setSelectedMarker}
              isLoading={mapData.isLoading}
              onRetry={mapData.refetchPositions}
              isFullScreen={false}
              onToggleFullScreen={handleToggleFullscreen}
            />
          </div>

          {/* LOWER SECTION: Vehicle Status Breakdown & System Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <VehicleStatusWidget kpis={dashboard.kpis} />
            <SystemEventsWidget events={dashboard.events} />
          </div>
        </div>

        {/* RIGHT SECTION: Recent Alerts & Active Trips */}
        <div className="space-y-4">
          <RecentAlertsWidget alerts={dashboard.alerts} />
          <RecentTripsWidget trips={dashboard.trips} />
        </div>
      </div>
    </div>
  );
};

