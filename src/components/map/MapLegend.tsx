"use client";

import React from "react";

export const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-3 left-3 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-xs space-y-1 text-left">
      <span className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
        Vehicle Status
      </span>
      <div className="flex items-center space-x-3 text-[11px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200">Moving</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200">Idle</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200">Stopped</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
          <span className="text-slate-700 dark:text-slate-200">Offline</span>
        </div>
      </div>
    </div>
  );
};
