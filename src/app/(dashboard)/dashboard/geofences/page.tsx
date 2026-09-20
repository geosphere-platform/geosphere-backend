"use client";

import React from "react";
import { useDashboardAuth } from "@/features/dashboard/hooks/useDashboardAuth";
import { GeofencesView } from "@/features/geofence/components/GeofencesView";

export default function GeofencesDashboardPage() {
  const { user } = useDashboardAuth();

  if (!user) {
    return null;
  }

  return <GeofencesView />;
}
