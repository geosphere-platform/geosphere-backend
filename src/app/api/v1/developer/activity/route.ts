import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { auditLogsTable } from "@/database/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

/**
 * GET /api/v1/developer/activity
 * Get application & credential audit activity log
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const developerActions = [
      "APPLICATION_CREATED",
      "APPLICATION_UPDATED",
      "APPLICATION_SUSPENDED",
      "APPLICATION_REACTIVATED",
      "APPLICATION_ARCHIVED",
      "API_KEY_CREATED",
      "API_KEY_ROTATED",
      "API_KEY_REVOKED",
    ];

    const logs = await db
      .select()
      .from(auditLogsTable)
      .where(
        and(
          eq(auditLogsTable.organizationId, orgId),
          inArray(auditLogsTable.action, developerActions),
        ),
      )
      .orderBy(sql`${auditLogsTable.createdAt} DESC`)
      .limit(50);

    return NextResponse.json({
      success: true,
      data: logs,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "ACTIVITY_FETCH_FAILED",
          message: err.message || "Failed to fetch activity log",
        },
      },
      { status: 400 },
    );
  }
}
