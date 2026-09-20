"use client";

import React from "react";
import { useDashboardAuth } from "@/features/dashboard/hooks/useDashboardAuth";
import { VehiclesView } from "@/features/vehicle/ui/VehiclesView";

export default function VehiclesDashboardPage() {
  const { user } = useDashboardAuth();

  if (!user) {
    return null;
  }

  return <VehiclesView />;
}
