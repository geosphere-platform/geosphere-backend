"use client";

import React from "react";

interface UpgradeRequiredProps {
  featureName?: string;
  requiredPlan?: string;
  currentPlan?: string;
  message?: string;
}

export const UpgradeRequired: React.FC<UpgradeRequiredProps> = ({
  featureName = "This feature",
  requiredPlan = "a higher",
  currentPlan,
  message,
}) => {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center shadow-lg backdrop-blur-md">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-slate-100">
        Plan Upgrade Required
      </h3>

      <p className="mt-2 text-sm text-slate-400">
        {message ||
          `${featureName} is not available on your current plan${currentPlan ? ` (${currentPlan})` : ""}. Upgrade to ${requiredPlan} tier to unlock access.`}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <a
          href="/dashboard/settings/subscription"
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-sm font-medium text-slate-950 hover:from-amber-400 hover:to-amber-500 transition-all shadow-md"
        >
          View Subscription & Plans
        </a>
      </div>
    </div>
  );
};
