"use client";

import React from "react";
import { EntitlementProvider } from "@/features/subscription/hooks/use-entitlements";
import { CurrentPlanCard } from "@/features/subscription/components/CurrentPlanCard";
import { UsageDashboard } from "@/features/subscription/components/UsageDashboard";
import { PlansList } from "@/features/subscription/components/PlansList";

export default function OrganizationSubscriptionPage() {
  return (
    <EntitlementProvider>
      <div className="mx-auto max-w-7xl space-y-8 p-6 text-slate-100">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-50 tracking-tight">
            Subscription & Usage
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View your current commercial plan, resource quotas, and current
            consumption.
          </p>
        </div>

        <CurrentPlanCard />

        <UsageDashboard />

        <PlansList />
      </div>
    </EntitlementProvider>
  );
}
