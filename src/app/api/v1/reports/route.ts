import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { PERMISSIONS } from "@/core/constants";
import { z } from "zod";

const ReportQuerySchema = z.object({
  timeRange: z.enum(["today", "yesterday", "7d", "30d"]).default("7d"),
  format: z.enum(["json", "csv"]).default("json"),
  vehicleId: z.string().optional(),
});

interface TripReportRecord {
  tripId: string;
  vehicleId: string;
  licensePlate: string;
  driverName: string;
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  fuelEfficiencyKmpl: number;
  geofenceViolations: number;
  status: "COMPLETED" | "IN_PROGRESS" | "FLAGGED";
  startTime: string;
  endTime: string;
}

const MOCK_TRIP_REPORTS: TripReportRecord[] = [
  {
    tripId: "TRIP-2024-901",
    vehicleId: "veh-001",
    licensePlate: "MH-31-FA-1001",
    driverName: "Rajesh Sharma",
    origin: "Nagpur Multi-Modal Cargo Hub",
    destination: "Butibori Industrial Terminal",
    distanceKm: 34.2,
    durationMinutes: 48,
    avgSpeedKmh: 42.8,
    maxSpeedKmh: 68.0,
    fuelEfficiencyKmpl: 4.8,
    geofenceViolations: 0,
    status: "COMPLETED",
    startTime: "2024-03-14T08:30:00Z",
    endTime: "2024-03-14T09:18:00Z",
  },
  {
    tripId: "TRIP-2024-902",
    vehicleId: "veh-002",
    licensePlate: "MH-31-FA-2002",
    driverName: "Amit Verma",
    origin: "Wardha Central Depot",
    destination: "Kalmeshwar Agro Hub",
    distanceKm: 58.6,
    durationMinutes: 76,
    avgSpeedKmh: 46.2,
    maxSpeedKmh: 74.0,
    fuelEfficiencyKmpl: 4.2,
    geofenceViolations: 0,
    status: "COMPLETED",
    startTime: "2024-03-14T09:15:00Z",
    endTime: "2024-03-14T10:31:00Z",
  },
  {
    tripId: "TRIP-2024-903",
    vehicleId: "veh-003",
    licensePlate: "MH-31-TR-8008",
    driverName: "Sanjay Patil",
    origin: "MIHAN Freight Terminal",
    destination: "Kamptee Logistics Hub",
    distanceKm: 28.5,
    durationMinutes: 41,
    avgSpeedKmh: 41.7,
    maxSpeedKmh: 64.0,
    fuelEfficiencyKmpl: 5.1,
    geofenceViolations: 0,
    status: "COMPLETED",
    startTime: "2024-03-14T11:00:00Z",
    endTime: "2024-03-14T11:41:00Z",
  },
  {
    tripId: "TRIP-2024-904",
    vehicleId: "veh-004",
    licensePlate: "MH-12-RN-4589",
    driverName: "Pooja Deshmukh",
    origin: "Hingna Industrial Area",
    destination: "Nagpur Urban Center",
    distanceKm: 18.2,
    durationMinutes: 32,
    avgSpeedKmh: 34.1,
    maxSpeedKmh: 55.0,
    fuelEfficiencyKmpl: 14.8, // Electric/hybrid
    geofenceViolations: 0,
    status: "COMPLETED",
    startTime: "2024-03-14T12:10:00Z",
    endTime: "2024-03-14T12:42:00Z",
  },
  {
    tripId: "TRIP-2024-905",
    vehicleId: "veh-005",
    licensePlate: "DL-01-AX-9231",
    driverName: "Vikas Mehra",
    origin: "Nagpur Express Corridor",
    destination: "Bhandara Distribution Gate",
    distanceKm: 64.8,
    durationMinutes: 84,
    avgSpeedKmh: 46.3,
    maxSpeedKmh: 82.0,
    fuelEfficiencyKmpl: 4.0,
    geofenceViolations: 1,
    status: "FLAGGED",
    startTime: "2024-03-14T13:00:00Z",
    endTime: "2024-03-14T14:24:00Z",
  },
];

export const GET = withAuth(async (ctx: AuthContext) => {
  const url = new URL(ctx.request.url);
  const parseResult = ReportQuerySchema.safeParse({
    timeRange: url.searchParams.get("timeRange") || "7d",
    format: url.searchParams.get("format") || "json",
    vehicleId: url.searchParams.get("vehicleId") || undefined,
  });

  if (!parseResult.success) {
    return ApiResponse.error("Invalid query parameters", 400, "INVALID_QUERY");
  }

  const { timeRange, format, vehicleId } = parseResult.data;

  let filtered = MOCK_TRIP_REPORTS;
  if (vehicleId) {
    filtered = filtered.filter((t) => t.vehicleId === vehicleId);
  }

  // Summary Metrics
  const totalDistanceKm = Number(
    filtered.reduce((acc, t) => acc + t.distanceKm, 0).toFixed(1)
  );
  const totalDurationMins = filtered.reduce((acc, t) => acc + t.durationMinutes, 0);
  const avgSpeedOverall = Number(
    (
      filtered.reduce((acc, t) => acc + t.avgSpeedKmh, 0) /
      (filtered.length || 1)
    ).toFixed(1)
  );
  const totalViolations = filtered.reduce((acc, t) => acc + t.geofenceViolations, 0);
  const slaCompliancePct = Number(
    (((filtered.length - totalViolations) / (filtered.length || 1)) * 100).toFixed(1)
  );

  // Return CSV format if requested
  if (format === "csv") {
    const headers = [
      "Trip ID",
      "Vehicle Plate",
      "Driver Name",
      "Origin",
      "Destination",
      "Distance (km)",
      "Duration (min)",
      "Avg Speed (km/h)",
      "Max Speed (km/h)",
      "Fuel Efficiency (km/L)",
      "Violations",
      "Status",
      "Start Time",
      "End Time",
    ];

    const rows = filtered.map((t) => [
      t.tripId,
      t.licensePlate,
      `"${t.driverName}"`,
      `"${t.origin}"`,
      `"${t.destination}"`,
      t.distanceKm,
      t.durationMinutes,
      t.avgSpeedKmh,
      t.maxSpeedKmh,
      t.fuelEfficiencyKmpl,
      t.geofenceViolations,
      t.status,
      t.startTime,
      t.endTime,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="geosphere-fleet-report-${timeRange}.csv"`,
      },
    });
  }

  // JSON Response
  return ApiResponse.success({
    timeRange,
    summary: {
      totalTrips: filtered.length,
      totalDistanceKm,
      totalDurationHours: Number((totalDurationMins / 60).toFixed(1)),
      avgSpeedOverallKmh: avgSpeedOverall,
      geofenceViolationsCount: totalViolations,
      slaComplianceRatePct: slaCompliancePct,
    },
    trips: filtered,
    geofenceCompliance: [
      {
        geofenceName: "Nagpur District Operating Boundary",
        level: "district",
        totalEntries: 28,
        totalExits: 14,
        avgDwellMinutes: 184,
        compliancePct: 98.2,
      },
      {
        geofenceName: "MIHAN Multi-Modal Cargo Hub",
        level: "terminal",
        totalEntries: 42,
        totalExits: 39,
        avgDwellMinutes: 44,
        compliancePct: 100.0,
      },
      {
        geofenceName: "Butibori Industrial Area & Depot",
        level: "depot",
        totalEntries: 19,
        totalExits: 18,
        avgDwellMinutes: 62,
        compliancePct: 97.4,
      },
    ],
  });
});
