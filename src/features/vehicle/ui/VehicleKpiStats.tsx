"use client";

import React from "react";
import { VehicleFleetStats } from "./vehicle-types";

interface VehicleKpiStatsProps {
  stats: VehicleFleetStats;
  onFilterClick?: (status: "all" | "moving" | "idle" | "maintenance" | "offline") => void;
  activeFilter?: string;
}

export const VehicleKpiStats: React.FC<VehicleKpiStatsProps> = ({
  stats,
  onFilterClick,
  activeFilter = "all",
}) => {
  const cards = [
    {
      id: "all",
      label: "Total Fleet",
      value: stats.total,
      subtext: `${stats.fleetUtilizationPct}% operational utilization`,
      icon: (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      accentBorder: "border-blue-500/30",
      accentBg: "hover:border-blue-500/60 bg-white dark:bg-slate-900/80",
      indicatorColor: "bg-blue-400",
    },
    {
      id: "moving",
      label: "Active & Moving",
      value: stats.moving,
      subtext: `Avg speed: ${stats.avgSpeed} km/h`,
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      accentBorder: "border-emerald-500/30",
      accentBg: "hover:border-emerald-500/60 bg-white dark:bg-slate-900/80",
      indicatorColor: "bg-emerald-400",
      pulse: true,
    },
    {
      id: "idle",
      label: "Idle / Parked",
      value: stats.idle,
      subtext: "Ignition ON / Standing by",
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      accentBorder: "border-amber-500/30",
      accentBg: "hover:border-amber-500/60 bg-white dark:bg-slate-900/80",
      indicatorColor: "bg-amber-400",
    },
    {
      id: "maintenance",
      label: "Maintenance",
      value: stats.maintenance,
      subtext: "Service bay / Inspection",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      accentBorder: "border-purple-500/30",
      accentBg: "hover:border-purple-500/60 bg-white dark:bg-slate-900/80",
      indicatorColor: "bg-purple-400",
    },
    {
      id: "offline",
      label: "Offline / Inactive",
      value: stats.offline,
      subtext: "No signal / Depot parked",
      icon: (
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.829-12.728M3 3l18 18" />
        </svg>
      ),
      accentBorder: "border-slate-700/40",
      accentBg: "hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/80",
      indicatorColor: "bg-slate-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
      {cards.map((c) => {
        const isSelected = activeFilter === c.id;
        return (
          <div
            key={c.id}
            onClick={() => onFilterClick && onFilterClick(c.id as any)}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer backdrop-blur-sm relative overflow-hidden shadow-sm ${
              c.accentBg
            } ${
              isSelected
                ? "ring-2 ring-blue-500 border-blue-500 shadow-lg shadow-blue-500/10"
                : `${c.accentBorder} hover:shadow-md`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {c.label}
              </span>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                {c.icon}
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                {c.value}
              </span>
              {c.pulse && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {c.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
};
