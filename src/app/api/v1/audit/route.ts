import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { z } from "zod";

const AuditQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  severity: z.enum(["ALL", "INFO", "WARNING", "CRITICAL"]).default("ALL"),
  action: z.string().optional(),
  search: z.string().optional(),
});

export interface AuditEventItem {
  id: string;
  timestamp: string;
  action: string;
  actor: {
    id: string;
    email: string;
    role: string;
  };
  entityType: "AUTH" | "VEHICLE" | "GEOFENCE" | "DISPATCH" | "SYSTEM" | "ORGANIZATION";
  entityId: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  ipAddress: string;
  details: string;
}

const MOCK_AUDIT_LOGS: AuditEventItem[] = [
  {
    id: "audit-evt-101",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    action: "USER_AUTHENTICATED",
    actor: {
      id: "usr-admin-01",
      email: "admin@fleet.com",
      role: "SUPER_ADMIN",
    },
    entityType: "AUTH",
    entityId: "session-9082",
    severity: "INFO",
    ipAddress: "192.168.1.45",
    details: "Super Admin authenticated via dual-token session with MFA validation.",
  },
  {
    id: "audit-evt-102",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    action: "GEOFENCE_CREATED",
    actor: {
      id: "usr-admin-01",
      email: "admin@fleet.com",
      role: "SUPER_ADMIN",
    },
    entityType: "GEOFENCE",
    entityId: "geo-nagpur-district",
    severity: "INFO",
    ipAddress: "192.168.1.45",
    details: "Created official district administrative geofence (Nagpur District) with 247 boundary vertices.",
  },
  {
    id: "audit-evt-103",
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    action: "GEOFENCE_VIOLATION_DETECTED",
    actor: {
      id: "system-engine",
      email: "system@geosphere.local",
      role: "SYSTEM",
    },
    entityType: "GEOFENCE",
    entityId: "DL-01-AX-9231",
    severity: "WARNING",
    ipAddress: "10.0.4.12",
    details: "Vehicle DL-01-AX-9231 breached permitted corridor boundary near Express Corridor exit.",
  },
  {
    id: "audit-evt-104",
    timestamp: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    action: "VEHICLE_TELEMETRY_INGESTED",
    actor: {
      id: "gps-gateway",
      email: "telemetry@geosphere.local",
      role: "SYSTEM",
    },
    entityType: "VEHICLE",
    entityId: "MH-31-FA-1001",
    severity: "INFO",
    ipAddress: "10.0.4.88",
    details: "Batch of 120 GPS telemetry points ingested via Teltonika FMB920 protocol adapter.",
  },
  {
    id: "audit-evt-105",
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    action: "DISPATCH_ORDER_UPDATED",
    actor: {
      id: "usr-disp-02",
      email: "dispatcher@fleet.com",
      role: "DISPATCHER",
    },
    entityType: "DISPATCH",
    entityId: "task-midc-402",
    severity: "INFO",
    ipAddress: "192.168.1.62",
    details: "Work order assigned to driver Rajesh Sharma (Vehicle MH-31-FA-1001).",
  },
  {
    id: "audit-evt-106",
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    action: "FAILED_LOGIN_ATTEMPT",
    actor: {
      id: "unknown",
      email: "unknown_tester@external.org",
      role: "ANONYMOUS",
    },
    entityType: "AUTH",
    entityId: "login_probe",
    severity: "CRITICAL",
    ipAddress: "45.33.32.156",
    details: "Multiple failed authentication attempts detected. Origin IP placed in rate-limiting cooldown.",
  },
  {
    id: "audit-evt-107",
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    action: "ORGANIZATION_SETTINGS_UPDATED",
    actor: {
      id: "usr-admin-01",
      email: "admin@fleet.com",
      role: "SUPER_ADMIN",
    },
    entityType: "ORGANIZATION",
    entityId: "org-enterprise-01",
    severity: "INFO",
    ipAddress: "192.168.1.45",
    details: "Updated spatial indexing tolerance threshold and activated automated SMS alerts.",
  },
];

export const GET = withAuth(async (ctx: AuthContext) => {
  const url = new URL(ctx.request.url);
  const parseResult = AuditQuerySchema.safeParse({
    limit: url.searchParams.get("limit") || 50,
    severity: url.searchParams.get("severity") || "ALL",
    action: url.searchParams.get("action") || undefined,
    search: url.searchParams.get("search") || undefined,
  });

  if (!parseResult.success) {
    return ApiResponse.error("Invalid query parameters", 400, "INVALID_QUERY");
  }

  const { limit, severity, action, search } = parseResult.data;

  let filtered = MOCK_AUDIT_LOGS;

  if (severity !== "ALL") {
    filtered = filtered.filter((evt) => evt.severity === severity);
  }

  if (action) {
    filtered = filtered.filter((evt) =>
      evt.action.toLowerCase().includes(action.toLowerCase())
    );
  }

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (evt) =>
        evt.action.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q) ||
        evt.actor.email.toLowerCase().includes(q) ||
        evt.entityId.toLowerCase().includes(q) ||
        evt.ipAddress.includes(q)
    );
  }

  const sliced = filtered.slice(0, limit);

  return ApiResponse.success({
    totalEvents: filtered.length,
    returnedEvents: sliced.length,
    events: sliced,
  });
});
