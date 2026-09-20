"use client";

import React, { useEffect, useState } from "react";
import { KpiItemData } from "../../types/fleet";
import { DashboardService } from "../../services/dashboard.service";

interface VehicleStatusWidgetProps {
  kpis: KpiItemData[];
}

export const VehicleStatusWidget: React.FC<VehicleStatusWidgetProps> = ({
  kpis,
}) => {
  const [liveStatus, setLiveStatus] = useState<{
    moving: number;
    idle: number;
    stopped: number;
    offline: number;
  } | null>(null);

  useEffect(() => {
    DashboardService.fetchVehicleStatus()
      .then((data) => setLiveStatus(data))
      .catch(() => setLiveStatus(null)); // fall back to KPI prop values
  }, []);

  const getKpiValue = (id: string) => {
    const item = kpis.find((k) => k.id === id);
    if (!item) return 0;
    return typeof item.value === "number"
      ? item.value
      : parseInt(String(item.value), 10) || 0;
  };

  const moving = liveStatus?.moving ?? getKpiValue("moving");
  const idle = liveStatus?.idle ?? getKpiValue("idle");
  const stopped = liveStatus?.stopped ?? 0;
  const offline = liveStatus?.offline ?? getKpiValue("offline");
  const total = moving + idle + stopped + offline || getKpiValue("total") || 1;
  const online = moving + idle + stopped;

  const movingPct = Math.round((moving / total) * 100);
  const idlePct = Math.round((idle / total) * 100);
  const stoppedPct = Math.round((stopped / total) * 100);
  const offlinePct = Math.round((offline / total) * 100);
  const onlinePct = Math.round((online / total) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4 text-left">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Fleet Status Breakdown
        </h3>
        <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
          {total} total
        </span>
      </div>

      {/* Visual Segmented Progress Bar */}
      <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
        <div
          style={{ width: `${movingPct}%` }}
          className="bg-emerald-500 transition-all duration-700"
          title={`Moving: ${movingPct}%`}
        />
        <div
          style={{ width: `${idlePct}%` }}
          className="bg-amber-500 transition-all duration-700"
          title={`Idle: ${idlePct}%`}
        />
        <div
          style={{ width: `${stoppedPct}%` }}
          className="bg-blue-500 transition-all duration-700"
          title={`Stopped: ${stoppedPct}%`}
        />
        <div
          style={{ width: `${offlinePct}%` }}
          className="bg-slate-400 transition-all duration-700"
          title={`Offline: ${offlinePct}%`}
        />
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-xs">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Moving
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {moving} ({movingPct}%)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Idle
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {idle} ({idlePct}%)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Online
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {online} ({onlinePct}%)
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          <div>
            <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
              Offline
            </span>
            <span className="font-bold text-slate-900 dark:text-white">
              {offline} ({offlinePct}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
