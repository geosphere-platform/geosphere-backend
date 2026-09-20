"use client";

import React from "react";
import { useEntitlements } from "../hooks/use-entitlements";

export const CurrentPlanCard: React.FC = () => {
  const { entitlements, isLoading } = useEntitlements();

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-900/50" />;
  }

  if (!entitlements) return null;

  const { plan, subscription, subscriptionStatus } = entitlements;

  const formatDate = (d: string | null | undefined) => {
    if (!d) return "N/A";
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900/80 dark:to-slate-950 p-6 shadow-sm dark:shadow-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 dark:border-slate-800 pb-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400 font-semibold">
            Current Subscription
          </span>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-50 mt-1">
            {plan?.name || "Free Tier"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide border ${
              subscriptionStatus === "ACTIVE"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                : subscriptionStatus === "TRIALING"
                  ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20"
                  : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
            }`}
          >
            {subscriptionStatus}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-xs sm:grid-cols-3">
        <div>
          <span className="text-gray-500 dark:text-slate-400">Starts At</span>
          <p className="mt-1 font-medium text-gray-800 dark:text-slate-200">
            {formatDate(subscription?.startsAt)}
          </p>
        </div>

        <div>
          <span className="text-gray-500 dark:text-slate-400">Renews / Ends</span>
          <p className="mt-1 font-medium text-gray-800 dark:text-slate-200">
            {formatDate(subscription?.endsAt)}
          </p>
        </div>

        {subscription?.trialEndsAt && (
          <div>
            <span className="text-gray-500 dark:text-slate-400">Trial Ends</span>
            <p className="mt-1 font-medium text-amber-600 dark:text-amber-400">
              {formatDate(subscription.trialEndsAt)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
