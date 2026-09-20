"use client";

import React from "react";
import Link from "next/link";
import { useVehiclesManagement } from "./useVehiclesManagement";
import { VehicleKpiStats } from "./VehicleKpiStats";
import { VehicleControlBar } from "./VehicleControlBar";
import { VehicleCardGrid } from "./VehicleCardGrid";
import { VehicleDataTable } from "./VehicleDataTable";
import { VehicleDetailsDrawer } from "./VehicleDetailsDrawer";
import { VehicleModalForm } from "./VehicleModalForm";
import { VehicleDeleteConfirmModal } from "./VehicleDeleteConfirmModal";

export const VehiclesView: React.FC = () => {
  const {
    vehicles,
    filteredVehicles,
    stats,
    filterState,
    isLoading,
    selectedVehicle,
    isAddModalOpen,
    editingVehicle,
    deletingVehicle,
    setSelectedVehicle,
    setIsAddModalOpen,
    setEditingVehicle,
    setDeletingVehicle,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    setViewMode,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    refreshVehicles,
  } = useVehiclesManagement();

  const [isFullScreen, setIsFullScreen] = React.useState<boolean>(false);

  const toggleFullScreen = React.useCallback(() => {
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

  React.useEffect(() => {
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

  return (
    <div
      className={
        isFullScreen
          ? "fixed inset-0 z-50 w-screen h-screen bg-slate-950 flex flex-col overflow-y-auto p-6 font-sans"
          : "w-full max-w-7xl mx-auto space-y-6"
      }
    >
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🚛</span>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
              Fleet Vehicles
            </h1>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              {vehicles.length} Units
            </span>
            {isFullScreen && (
              <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Full-Screen NOC Mode
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            Enterprise fleet registry, live operational telemetry, driver assignments, and vehicle specifications.
          </p>
        </div>

        {/* Top Quick Status Pill & Exit Fullscreen CTA */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {isFullScreen && (
            <>
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
                href="/dashboard/geofences"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                📍 Geofences
              </Link>

              <button
                type="button"
                onClick={toggleFullScreen}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg transition-colors flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Exit Fullscreen (Esc)</span>
              </button>
            </>
          )}

          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-gray-700 dark:text-slate-300 shadow-sm dark:shadow-md transition-colors">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-gray-900 dark:text-slate-200">
              {stats.moving} Active on Road
            </span>
            <span className="text-gray-300 dark:text-slate-600">|</span>
            <span className="text-gray-500 dark:text-slate-400">
              {stats.fleetUtilizationPct}% Fleet Utilization
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <VehicleKpiStats
        stats={stats}
        onFilterClick={setStatusFilter}
        activeFilter={filterState.status}
      />

      {/* Control Bar (Search, Status Filter, View Toggle, Add Vehicle CTA) */}
      <VehicleControlBar
        searchQuery={filterState.searchQuery}
        statusFilter={filterState.status}
        typeFilter={filterState.type}
        viewMode={filterState.viewMode}
        stats={stats}
        isFullScreen={isFullScreen}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onTypeFilterChange={setTypeFilter}
        onViewModeChange={setViewMode}
        onToggleFullScreen={toggleFullScreen}
        onAddVehicleClick={() => setIsAddModalOpen(true)}
        onRefreshClick={refreshVehicles}
        isLoading={isLoading}
      />

      {/* Main Content Area (Grid or Table) */}
      {filterState.viewMode === "grid" ? (
        <VehicleCardGrid
          vehicles={filteredVehicles}
          onSelectVehicle={setSelectedVehicle}
          onEditVehicle={setEditingVehicle}
          onDeleteVehicle={setDeletingVehicle}
          onResetFilters={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setTypeFilter("all");
          }}
        />
      ) : (
        <VehicleDataTable
          vehicles={filteredVehicles}
          onSelectVehicle={setSelectedVehicle}
          onEditVehicle={setEditingVehicle}
          onDeleteVehicle={setDeletingVehicle}
          onResetFilters={() => {
            setSearchQuery("");
            setStatusFilter("all");
            setTypeFilter("all");
          }}
        />
      )}

      {/* Details Slide-over Drawer */}
      <VehicleDetailsDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onEdit={(v) => {
          setSelectedVehicle(null);
          setEditingVehicle(v);
        }}
        onStatusChange={async (id, status) => {
          await updateVehicle(id, { status });
        }}
      />

      {/* Add Vehicle Modal */}
      <VehicleModalForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={addVehicle}
        mode="create"
      />

      {/* Edit Vehicle Modal */}
      <VehicleModalForm
        isOpen={Boolean(editingVehicle)}
        initialData={editingVehicle}
        onClose={() => setEditingVehicle(null)}
        onSubmit={async (data) => {
          if (editingVehicle) {
            return updateVehicle(editingVehicle.id, data);
          }
          return false;
        }}
        mode="edit"
      />

      {/* Delete Confirmation Modal */}
      <VehicleDeleteConfirmModal
        vehicle={deletingVehicle}
        onClose={() => setDeletingVehicle(null)}
        onConfirm={deleteVehicle}
      />
    </div>
  );
};
