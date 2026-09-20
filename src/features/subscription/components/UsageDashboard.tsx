"use client";

import React from "react";
import { useEntitlements } from "../hooks/use-entitlements";

interface MetricDisplayItem {
  key: string;
  label: string;
  metricCode: string;
  unit?: string;
  formatValue?: (val: number) => string;
}

const METRICS: MetricDisplayItem[] = [
  { key: "USERS", label: "Team Members", metricCode: "MAX_USERS" },
  { key: "WORKSPACES", label: "Workspaces", metricCode: "MAX_WORKSPACES" },
  { key: "LAYERS", label: "GIS Layers", metricCode: "MAX_LAYERS" },
  {
    key: "DATASETS",
    label: "Spatial Datasets",
    metricCode: "MAX_SPATIAL_DATASETS",
  },
  { key: "RULES", label: "Automation Rules", metricCode: "MAX_RULES" },
  { key: "ALERTS", label: "Alert Triggers", metricCode: "MAX_ALERTS" },
  {
    key: "API_REQUESTS",
    label: "API Requests (Monthly)",
    metricCode: "MAX_API_REQUESTS",
  },
  {
    key: "SPATIAL_QUERIES",
    label: "Spatial Queries (Monthly)",
    metricCode: "MAX_SPATIAL_QUERIES",
  },
  {
    key: "REALTIME_CONNECTIONS",
    label: "Realtime Connections",
    metricCode: "MAX_REALTIME_CONNECTIONS",
  },
  {
    key: "STORAGE_BYTES",
    label: "Storage Space",
    metricCode: "MAX_STORAGE_BYTES",
    formatValue: (bytes) => {
      if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
      if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
      return `${(bytes / 1024).toFixed(1)} KB`;
    },
  },
];

export const UsageDashboard: React.FC = () => {
  const { entitlements, isLoading, error } = useEntitlements();

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-md">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-800" />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-slate-800/40"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !entitlements) {
    return (
      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-rose-300 text-sm">
        Failed to load usage data: {error || "No entitlement context available"}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100">
            Resource Usage & Quotas
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Real-time usage against plan limits for{" "}
            {entitlements.plan?.name || "Free Tier"}
          </p>
        </div>
        <span className="rounded-full bg-cyan-50 dark:bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
          Status: {entitlements.subscriptionStatus}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {METRICS.map((item) => {
          const usageVal = entitlements.usage[item.key] ?? 0;
          const limitInfo = entitlements.limits[item.metricCode];
          const isUnlimited = limitInfo?.isUnlimited ?? false;
          const limitVal = limitInfo?.numericValue ?? null;

          let percent = 0;
          if (!isUnlimited && limitVal && limitVal > 0) {
            percent = Math.min(100, Math.round((usageVal / limitVal) * 100));
          }

          // 80% / 90% / 100% threshold color coding
          let barColor = "bg-cyan-500";
          let textColor = "text-gray-600 dark:text-slate-300";
          if (percent >= 100) {
            barColor = "bg-rose-500";
            textColor = "text-rose-600 dark:text-rose-400 font-semibold";
          } else if (percent >= 90) {
            barColor = "bg-amber-500";
            textColor = "text-amber-600 dark:text-amber-400";
          } else if (percent >= 80) {
            barColor = "bg-yellow-500";
          }

          const formattedUsage = item.formatValue
            ? item.formatValue(usageVal)
            : usageVal.toLocaleString();
          const formattedLimit = isUnlimited
            ? "Unlimited"
            : limitVal !== null
              ? item.formatValue
                ? item.formatValue(limitVal)
                : limitVal.toLocaleString()
              : "N/A";

          return (
            <div
              key={item.key}
              className="rounded-xl border border-gray-200 dark:border-slate-800/80 bg-gray-50/80 dark:bg-slate-950/40 p-4 transition-all hover:border-gray-300 dark:hover:border-slate-700"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-800 dark:text-slate-200">{item.label}</span>
                <span className={`text-xs ${textColor}`}>
                  {formattedUsage} / {formattedLimit}
                </span>
              </div>

              {!isUnlimited && limitVal !== null ? (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-800">
                    <div
                      className={`h-full ${barColor} transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-500 dark:text-slate-500">
                    <span>{percent}% used</span>
                    {percent >= 100 && (
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">
                        Limit Reached
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-[11px] text-cyan-600 dark:text-cyan-400/80 font-medium">
                  ✓ Unlimited capacity
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
