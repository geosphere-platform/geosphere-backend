"use client";

import { useDashboardAuth } from "@/features/dashboard/hooks/useDashboardAuth";
import { FleetDashboardOverview } from "@/features/dashboard/components/FleetDashboardOverview";

export default function DashboardPage() {
  const { user } = useDashboardAuth();

  if (!user) {
    return null;
  }

  return <FleetDashboardOverview user={user} />;
}
