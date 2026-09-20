"use client";

import React from "react";
import { useDashboardAuth } from "@/features/dashboard/hooks/useDashboardAuth";
import { LiveTrackingView } from "@/features/tracking/components/LiveTrackingView";

export default function LiveTrackingPage() {
  const { user } = useDashboardAuth();

  if (!user) {
    return null;
  }

  return <LiveTrackingView />;
}
