"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useGeofences } from "../hooks/useGeofences";
import { GeofenceKpiStats } from "./GeofenceKpiStats";
import { GeofenceSidebarList } from "./GeofenceSidebarList";
import { GeofenceMap } from "./GeofenceMap";
import { GeofenceDetailsDrawer } from "./GeofenceDetailsDrawer";
import { GeofenceCreateModal } from "./GeofenceCreateModal";
import { GeofenceDeleteModal } from "./GeofenceDeleteModal";

export const GeofencesView: React.FC = () => {
  const {
    zones,
    filteredZones,
    stats,
    selectedZoneId,
    selectedZone,
    filterState,
    isCreateModalOpen,
    isDetailsDrawerOpen,
    zoneToDelete,
    isFullscreen,
    containerRef,
    setSearchQuery,
    setCategoryFilter,
    setShapeFilter,
    selectZone,
    setIsCreateModalOpen,
    setIsDetailsDrawerOpen,
    setZoneToDelete,
    toggleFullscreen,
    addZone,
    toggleZoneEnabled,
    deleteZone,
  } = useGeofences();

  // Digital clock for Command Center HUD
  const [currentTime, setCurrentTime] = useState("");
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // FULL-SCREEN COMMAND CENTER / NOC MODE
  // -------------------------------------------------------------
  if (isFullscreen) {
    return (
      <div
        ref={containerRef}
        className="fixed inset-0 z-50 w-screen h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans select-none"
      >
        {/* Top Command Center HUD */}
        <header className="h-14 bg-slate-900/95 border-b border-slate-800 px-4 flex items-center justify-between flex-shrink-0 backdrop-blur-md z-20">
          {/* Left: Brand Indicator & Digital Clock */}
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Geofence Command Center
            </span>

            <div className="hidden sm:flex items-center text-xs text-slate-300 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
              <span className="text-slate-400 mr-1.5">🕒</span>
              <span>{currentTime}</span>
            </div>

            {/* Quick Metrics Ticker */}
            <div className="hidden lg:flex items-center space-x-2 text-xs">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Zones: <strong className="text-white">{stats.total}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                Armed: <strong>{stats.active}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-400">
                Inside Now: <strong>{stats.vehiclesInside}</strong>
              </span>
              <span className="px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
                Alerts Today: <strong>{stats.alertsToday}</strong>
              </span>
            </div>
          </div>

          {/* Right: Operational Controls */}
          <div className="flex items-center space-x-2.5">
            {/* Quick module links in Fullscreen */}
            <Link
              href="/dashboard"
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              📊 Dashboard
            </Link>
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

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>+</span>
              <span>New Zone</span>
            </button>

            {/* Exit Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Exit Fullscreen (Esc)"
            >
              <span>⛶</span>
              <span>Exit (Esc)</span>
            </button>
          </div>
        </header>

        {/* Fullscreen Workspace: Sidebar + Map */}
        <div className="flex-1 flex overflow-hidden relative">
          {/* Sidebar */}
          <div className="h-full">
            <GeofenceSidebarList
              zones={filteredZones}
              selectedZoneId={selectedZoneId}
              searchQuery={filterState.searchQuery}
              categoryFilter={filterState.category}
              shapeFilter={filterState.shape}
              onSearchChange={setSearchQuery}
              onCategoryChange={setCategoryFilter}
              onShapeChange={setShapeFilter}
              onSelectZone={selectZone}
              onToggleEnabled={toggleZoneEnabled}
              onRequestDelete={setZoneToDelete}
              onCreateClick={() => setIsCreateModalOpen(true)}
            />
          </div>

          {/* Map */}
          <div className="flex-1 h-full p-2">
            <GeofenceMap
              zones={zones}
              selectedZone={selectedZone}
              onSelectZone={selectZone}
              isFullscreen={true}
            />
          </div>

          {/* Details Drawer in Fullscreen */}
          <GeofenceDetailsDrawer
            zone={selectedZone}
            isOpen={isDetailsDrawerOpen}
            onClose={() => setIsDetailsDrawerOpen(false)}
            onToggleEnabled={toggleZoneEnabled}
            onRequestDelete={setZoneToDelete}
          />
        </div>

        {/* Modals */}
        <GeofenceCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={addZone}
        />
        <GeofenceDeleteModal
          zone={zoneToDelete}
          isOpen={!!zoneToDelete}
          onClose={() => setZoneToDelete(null)}
          onConfirm={deleteZone}
        />
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD LAYOUT (Within Dashboard Shell)
  // -------------------------------------------------------------
  return (
    <div ref={containerRef} className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm dark:shadow-xl gap-4 transition-colors">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5 text-gray-900 dark:text-white">
            <span>Virtual Zones & Geofences</span>
          </h1>
          <p className="text-gray-500 dark:text-slate-300 text-xs mt-1">
            Configure circular and custom boundaries with automated vehicle entry, exit, and dwell notifications.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Fullscreen Command Center Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            ⛶ Fullscreen Command Center
          </button>

          {/* New Zone Button */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
          >
            <span>+</span>
            <span>New Boundary</span>
          </button>

          {/* Quick Navigation Link to Live Tracking */}
          <Link
            href="/dashboard/tracking"
            className="px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 border border-gray-200 dark:border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <span>Live Tracking</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* TOP SECTION: 4 KPI Cards */}
      <section aria-label="Geofence Key Metrics">
        <GeofenceKpiStats
          stats={stats}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />
      </section>

      {/* MAIN WORKSPACE: Sidebar + Interactive Map */}
      <div className="flex flex-col lg:flex-row gap-4 h-[650px]">
        {/* Sidebar Zone List */}
        <GeofenceSidebarList
          zones={filteredZones}
          selectedZoneId={selectedZoneId}
          searchQuery={filterState.searchQuery}
          categoryFilter={filterState.category}
          shapeFilter={filterState.shape}
          onSearchChange={setSearchQuery}
          onCategoryChange={setCategoryFilter}
          onShapeChange={setShapeFilter}
          onSelectZone={selectZone}
          onToggleEnabled={toggleZoneEnabled}
          onRequestDelete={setZoneToDelete}
          onCreateClick={() => setIsCreateModalOpen(true)}
        />

        {/* Map View */}
        <div className="flex-1 h-full">
          <GeofenceMap
            zones={zones}
            selectedZone={selectedZone}
            onSelectZone={selectZone}
            isFullscreen={false}
          />
        </div>
      </div>

      {/* Side Details Drawer */}
      <GeofenceDetailsDrawer
        zone={selectedZone}
        isOpen={isDetailsDrawerOpen}
        onClose={() => setIsDetailsDrawerOpen(false)}
        onToggleEnabled={toggleZoneEnabled}
        onRequestDelete={setZoneToDelete}
      />

      {/* Create Modal */}
      <GeofenceCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={addZone}
      />

      {/* Delete Confirmation Modal */}
      <GeofenceDeleteModal
        zone={zoneToDelete}
        isOpen={!!zoneToDelete}
        onClose={() => setZoneToDelete(null)}
        onConfirm={deleteZone}
      />
    </div>
  );
};
