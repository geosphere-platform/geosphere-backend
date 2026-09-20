"use client";

import React, { useEffect, useState } from "react";
import { useEntitlements } from "../hooks/use-entitlements";

interface PlanItem {
  id: string;
  code: string;
  name: string;
  description: string;
  monthlyPriceCents: number;
  yearlyPriceCents: number;
  currency: string;
}

export const PlansList: React.FC = () => {
  const { entitlements } = useEntitlements();
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("gis_access_token")
        : null;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch("/api/v1/subscriptions/plans", { headers })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch commercial plans");
        return res.json();
      })
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setPlans(data.data);
        } else {
          setPlans([
            { id: "free", code: "FREE", name: "Community Starter", description: "Essential GIS & telemetry for evaluation.", monthlyPriceCents: 0, yearlyPriceCents: 0, currency: "USD" },
            { id: "growth", code: "GROWTH", name: "Growth Fleet", description: "Real-time dispatch, boundary automation & reports.", monthlyPriceCents: 14900, yearlyPriceCents: 149000, currency: "USD" },
            { id: "pro", code: "PRO", name: "Enterprise Fleet Tier", description: "Advanced spatial clustering, sub-second telemetry & audit.", monthlyPriceCents: 39900, yearlyPriceCents: 399000, currency: "USD" },
          ]);
        }
      })
      .catch(() => {
        setPlans([
          { id: "free", code: "FREE", name: "Community Starter", description: "Essential GIS & telemetry for evaluation.", monthlyPriceCents: 0, yearlyPriceCents: 0, currency: "USD" },
          { id: "growth", code: "GROWTH", name: "Growth Fleet", description: "Real-time dispatch, boundary automation & reports.", monthlyPriceCents: 14900, yearlyPriceCents: 149000, currency: "USD" },
          { id: "pro", code: "PRO", name: "Enterprise Fleet Tier", description: "Advanced spatial clustering, sub-second telemetry & audit.", monthlyPriceCents: 39900, yearlyPriceCents: 399000, currency: "USD" },
        ]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-900/50" />;
  }

  const currentPlanCode = entitlements?.plan?.code;

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-4">
        Available Commercial Plans
      </h3>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((p) => {
          const isCurrent = currentPlanCode === p.code;
          const monthlyDollars = p.monthlyPriceCents
            ? p.monthlyPriceCents / 100
            : 0;

          return (
            <div
              key={p.id}
              className={`flex flex-col justify-between rounded-2xl border p-6 transition-all ${
                isCurrent
                  ? "border-cyan-500/50 bg-cyan-50 dark:bg-cyan-500/5 shadow-sm dark:shadow-lg dark:shadow-cyan-500/10"
                  : "border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-gray-300 dark:hover:border-slate-700 shadow-sm dark:shadow-none"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-slate-100">{p.name}</h4>
                  {isCurrent && (
                    <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">
                      CURRENT
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-500 dark:text-slate-400 min-h-[36px]">
                  {p.description}
                </p>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-gray-900 dark:text-slate-50">
                    ${monthlyDollars}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-slate-400">/ month</span>
                </div>
              </div>

              <div className="mt-6">
                {isCurrent ? (
                  <button
                    disabled
                    className="w-full rounded-xl bg-gray-100 dark:bg-slate-800 py-2 text-xs font-semibold text-gray-400 dark:text-slate-400 border border-gray-200 dark:border-slate-700 cursor-default"
                  >
                    Active Plan
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      alert(
                        `To change plan to ${p.name}, please contact your platform administrator. (Payment integration disabled in Phase 13)`,
                      )
                    }
                    className="w-full rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 py-2 text-xs font-semibold text-gray-800 dark:text-slate-200 transition-colors border border-gray-200 dark:border-slate-700 shadow-2xs"
                  >
                    Request Plan
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
