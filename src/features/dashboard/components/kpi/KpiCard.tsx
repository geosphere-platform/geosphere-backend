"use client";

import React from "react";
import { KpiItemData } from "../../types/fleet";

interface KpiCardProps {
  data?: KpiItemData;
  icon: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  onRetry?: () => void;
  onClick?: () => void;
}

const themeStyles: Record<
  KpiItemData["colorTheme"],
  { bg: string; text: string; ring: string }
> = {
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
  },
  green: {
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    ring: "ring-green-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
  },
  gray: {
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    ring: "ring-slate-500/20",
  },
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/20",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/20",
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  data,
  icon,
  isLoading = false,
  isError = false,
  isEmpty = false,
  onRetry,
  onClick,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm animate-pulse space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2">
        <span className="text-xs font-semibold text-red-600 dark:text-red-400">
          Failed to load metric
        </span>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Unable to retrieve data
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline text-left"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (isEmpty || !data) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
        <span className="text-xs font-semibold text-slate-400">No Data</span>
        <span className="text-xl font-bold text-slate-400">--</span>
      </div>
    );
  }

  const theme = themeStyles[data.colorTheme];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm text-left transition-all ${
        onClick
          ? "hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
          : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
          {data.label}
        </span>
        <div className={`p-2 rounded-lg ${theme.bg} ${theme.text} shrink-0`}>
          {icon}
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {data.value}
        </span>
      </div>

      {data.trend && (
        <div className="mt-2 flex items-center space-x-1">
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              data.trend.isPositive
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400"
                : "bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400"
            }`}
          >
            {data.trend.value}
          </span>
        </div>
      )}
    </Component>
  );
};
