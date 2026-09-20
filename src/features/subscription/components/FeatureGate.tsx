"use client";

import React from "react";
import { useEntitlements } from "../hooks/use-entitlements";
import { UpgradeRequired } from "./UpgradeRequired";

interface FeatureGateProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  children,
}) => {
  const { hasFeature, isLoading, entitlements } = useEntitlements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        <span className="ml-3 text-sm">Verifying capabilities...</span>
      </div>
    );
  }

  if (!hasFeature(feature)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <UpgradeRequired
        featureName={feature}
        currentPlan={entitlements?.plan?.name}
      />
    );
  }

  return <>{children}</>;
};
