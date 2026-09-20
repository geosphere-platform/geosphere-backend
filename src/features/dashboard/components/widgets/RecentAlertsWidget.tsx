"use client";

import React from "react";
import { FleetAlert } from "../../types/fleet";

interface RecentAlertsWidgetProps {
  alerts: FleetAlert[];
}

export const RecentAlertsWidget: React.FC<RecentAlertsWidgetProps> = ({
  alerts,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          Recent Vehicle Alerts
        </h3>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
          View All ({alerts.length})
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            No recent vehicle alerts
          </p>
        ) : (
          alerts.slice(0, 4).map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-left"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {alert.vehicleName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    alert.severity === "critical"
                      ? "bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300"
                      : alert.severity === "warning"
                        ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300"
                        : "bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  {alert.severity}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-snug">
                {alert.message}
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                <span>{alert.licensePlate}</span>
                <span>{alert.timestamp}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
