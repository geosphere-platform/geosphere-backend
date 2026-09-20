import { NextRequest, NextResponse } from "next/server";
import { usageService } from "@/core/subscription/usage.service";
import { entitlementService } from "@/core/subscription/entitlement.service";

/**
 * GET /api/v1/developer/usage
 * Get developer application & API request metered usage
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const usageSummary = await usageService.getUsageSummary(orgId);
    const entitlements =
      await entitlementService.getEffectiveEntitlements(orgId);

    return NextResponse.json({
      success: true,
      data: {
        usage: usageSummary,
        entitlements: entitlements.limits,
        subscriptionStatus: entitlements.subscriptionStatus,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "USAGE_FETCH_FAILED",
          message: err.message || "Failed to fetch usage metrics",
        },
      },
      { status: 400 },
    );
  }
}
