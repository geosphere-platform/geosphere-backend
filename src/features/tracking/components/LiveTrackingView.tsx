"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLiveTrackingStream } from "../hooks/useLiveTrackingStream";
import { useUserLiveLocation } from "../hooks/useUserLiveLocation";
import { LiveTrackingHeader } from "./LiveTrackingHeader";
import { LiveFleetSidebar } from "./LiveFleetSidebar";
import { LiveTrackingMap } from "./LiveTrackingMap";
import { LiveTelemetryHUD } from "./LiveTelemetryHUD";
import { TrackingStatusFilter } from "../types";

export const LiveTrackingView: React.FC = () => {
  const {
    entities,
    filteredEntities,
    selectedEntity,
    selectedEntityId,
    geofences,
    metrics,
    filterState,
    connectionStatus,
    lastPingTime,
    selectEntity,
    setStatusFilter,
    setSearchQuery,
    toggleBreadcrumbs,
    toggleGeofences,
    toggleFollowSelected,
    toggleSimulation,
    setBasemap,
    refreshNow,
  } = useLiveTrackingStream();

  const {
    userLocation,
    requestLiveLocation,
  } = useUserLiveLocation();

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isSidebarOpenInFullScreen, setIsSidebarOpenInFullScreen] = useState<boolean>(true);

  // Fullscreen toggle handler with browser Fullscreen API integration
  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => {
      const next = !prev;
      if (next) {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
      return next;
    });
  }, []);

  // Listen to Escape key & native browser fullscreen change events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullScreen) {
        setIsFullScreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isFullScreen]);

  // ───────────────────────────────────────────────────────────────────────────
  // FULL SCREEN OPERATIONAL VIEW
  // ───────────────────────────────────────────────────────────────────────────
  if (isFullScreen) {
    const statusFilters: { key: TrackingStatusFilter; label: string; count: number }[] = [
      { key: "all", label: "All", count: metrics.total },
      { key: "moving", label: "Moving", count: metrics.moving },
      { key: "idle", label: "Idle", count: metrics.idle },
      { key: "offline", label: "Offline", count: metrics.offline },
    ];

    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-hidden font-sans">
        {/* Fullscreen Top HUD Operations Bar */}
        <header className="h-14 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 flex items-center justify-between gap-3 text-white flex-shrink-0 z-20 shadow-xl">
          {/* Brand & Live Pulse Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-extrabold text-sm tracking-wide text-slate-100 hidden sm:inline">
                LIVE GPS FLEET TRACKING
              </span>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {connectionStatus.toUpperCase()}
            </span>

            {/* Compact Metric Badges */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Total: <strong>{metrics.total}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                Moving: <strong>{metrics.moving}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/40">
                Idle: <strong>{metrics.idle}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                Offline: <strong>{metrics.offline}</strong>
              </span>
            </div>
          </div>

          {/* Quick Filter Chips */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {statusFilters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterState.status === f.key
                    ? "bg-blue-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          {/* Quick Actions & Exit Fullscreen Button */}
          <div className="flex items-center gap-2">
            {/* Toggle Fleet List Drawer Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpenInFullScreen((prev) => !prev)}
              title="Toggle Fleet List Panel"
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 ${
                isSidebarOpenInFullScreen
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
              }`}
            >
              <span>{isSidebarOpenInFullScreen ? "◀ Hide Fleet" : "▶ Show Fleet"}</span>
            </button>

            {/* Follow Cam Toggle */}
            <button
              type="button"
              onClick={toggleFollowSelected}
              title="Toggle Follow Vehicle Camera"
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filterState.followSelected
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <span>🎯 Follow</span>
            </button>

            {/* Trails Toggle */}
            <button
              type="button"
              onClick={toggleBreadcrumbs}
              title="Toggle Route Trails"
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                filterState.showBreadcrumbs
                  ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                  : "bg-slate-800 text-slate-400 border-slate-700"
              }`}
            >
              <span>👣 Trails</span>
            </button>

            {/* Quick module links in Fullscreen */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              📊 Dashboard
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

            {/* Exit Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullScreen}
              title="Exit Fullscreen Mode (Esc)"
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Exit Fullscreen</span>
            </button>
          </div>
        </header>

        {/* Fullscreen Map Canvas & Floating Panels */}
        <div className="relative flex-1 w-full h-full overflow-hidden">
          {/* Fullscreen Map Canvas */}
          <LiveTrackingMap
            entities={filteredEntities}
            selectedEntity={selectedEntity}
            userLocation={userLocation}
            geofences={geofences}
            showBreadcrumbs={filterState.showBreadcrumbs}
            showGeofences={filterState.showGeofences}
            followSelected={filterState.followSelected}
            activeBasemap={filterState.activeBasemap}
            isFullScreen={true}
            onToggleFullScreen={toggleFullScreen}
            onSelectEntity={(id) => selectEntity(id)}
            onToggleFollow={toggleFollowSelected}
            onChangeBasemap={setBasemap}
            onRequestUserLocation={requestLiveLocation}
          />

          {/* Floating Fleet Directory Panel (Collapsible Drawer) */}
          {isSidebarOpenInFullScreen && (
            <div className="absolute left-4 top-20 bottom-4 z-20 w-80 lg:w-96 shadow-2xl flex flex-col transition-all">
              <LiveFleetSidebar
                entities={filteredEntities}
                selectedEntityId={selectedEntityId}
                statusFilter={filterState.status}
                searchQuery={filterState.searchQuery}
                onSelectEntity={(id) => selectEntity(id)}
                onStatusFilterChange={setStatusFilter}
                onSearchChange={setSearchQuery}
              />
            </div>
          )}

          {/* Floating Telemetry HUD Card */}
          <LiveTelemetryHUD
            entity={selectedEntity}
            isFollowing={filterState.followSelected}
            showBreadcrumbs={filterState.showBreadcrumbs}
            onToggleFollow={toggleFollowSelected}
            onToggleBreadcrumbs={toggleBreadcrumbs}
            onClose={() => selectEntity(null)}
          />
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGULAR / EMBEDDED DASHBOARD VIEW
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* 1. Header with Live Status & Controls */}
      <LiveTrackingHeader
        metrics={metrics}
        filterState={filterState}
        userLocation={userLocation}
        connectionStatus={connectionStatus}
        lastPingTime={lastPingTime}
        onToggleSimulation={toggleSimulation}
        onToggleFollow={toggleFollowSelected}
        onToggleBreadcrumbs={toggleBreadcrumbs}
        onToggleGeofences={toggleGeofences}
        onRefresh={refreshNow}
        onToggleFullScreen={toggleFullScreen}
      />

      {/* 2. Main Tracking Workspace: Sidebar + Map + Telemetry HUD */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Left Interactive Fleet Directory */}
        <LiveFleetSidebar
          entities={filteredEntities}
          selectedEntityId={selectedEntityId}
          statusFilter={filterState.status}
          searchQuery={filterState.searchQuery}
          onSelectEntity={(id) => selectEntity(id)}
          onStatusFilterChange={setStatusFilter}
          onSearchChange={setSearchQuery}
        />

        {/* Right Map Canvas with HUD Overlay */}
        <div className="flex-1 w-full relative">
          <LiveTrackingMap
            entities={filteredEntities}
            selectedEntity={selectedEntity}
            userLocation={userLocation}
            geofences={geofences}
            showBreadcrumbs={filterState.showBreadcrumbs}
            showGeofences={filterState.showGeofences}
            followSelected={filterState.followSelected}
            activeBasemap={filterState.activeBasemap}
            isFullScreen={false}
            onToggleFullScreen={toggleFullScreen}
            onSelectEntity={(id) => selectEntity(id)}
            onToggleFollow={toggleFollowSelected}
            onChangeBasemap={setBasemap}
            onRequestUserLocation={requestLiveLocation}
          />

          {/* Floating Telemetry HUD Card */}
          <LiveTelemetryHUD
            entity={selectedEntity}
            isFollowing={filterState.followSelected}
            showBreadcrumbs={filterState.showBreadcrumbs}
            onToggleFollow={toggleFollowSelected}
            onToggleBreadcrumbs={toggleBreadcrumbs}
            onClose={() => selectEntity(null)}
          />
        </div>
      </div>

      {/* 3. Operational Guidance Card */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-gray-600 dark:text-slate-400 shadow-sm dark:shadow-none transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="font-bold text-gray-900 dark:text-slate-200 flex items-center gap-1.5">
              💡 Quick Operational Guide (India Hub)
            </h4>
            <p>
              • Default Region: <strong>Central India Zero Mile (Nagpur Hub)</strong> with live Indian fleet movements.
              • Full Screen Map: Click <strong>Fullscreen</strong> on the map toolbar to toggle a full-screen operational view with floating HUD and collapsible fleet directory.
              • Your Live Location is continuously tracked on the map with a prominent blue <strong>📍 You Are Here</strong> indicator.
              • Click <strong>📍 My Location</strong> to zoom and center directly on your live GPS position.
              • Click <strong>🇮🇳 India Hub</strong> to reset view to Central India operations.
              • Toggle <strong>Follow Cam</strong> to automatically pan the map with moving vehicles.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={toggleFullScreen}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
              <span>Open Fullscreen Map</span>
            </button>
            <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 font-mono text-[11px]">
              WGS84 EPSG:4326
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
