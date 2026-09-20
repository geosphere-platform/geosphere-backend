import { NextRequest, NextResponse } from "next/server";
import { packageAccessService } from "@/core/sdk/package-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/downloads
 * Customer: get SDK download history for their organization.
 * Useful for auditing and debugging.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";
    const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);

    const history = await packageAccessService.getDownloadHistory(
      orgId,
      Math.min(limit, 500),
    );
    return NextResponse.json({ success: true, data: history });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 500;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: err.errorCode ?? "INTERNAL_ERROR",
          message: err.message,
        },
      },
      { status },
    );
  }
}
