import { NextRequest, NextResponse } from "next/server";
import { sdkAccessService } from "@/core/sdk/sdk-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/developer/sdk/validate
 *
 * Internal endpoint for SDK clients to validate their access.
 * Used by the GIS SDK to confirm: license valid, version allowed, entitlements active.
 *
 * Security:
 *   - Client CANNOT modify license status, entitlements, or subscription via this endpoint
 *   - Server controls all authorization decisions
 *   - Returns structured result without exposing internal license IDs unnecessarily
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";

    if (!body.applicationId || !body.productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "applicationId and productId are required",
          },
        },
        { status: 400 },
      );
    }

    const result = await sdkAccessService.validateAccess(
      body.applicationId,
      body.productId,
      orgId,
      body.requestedVersion,
    );

    if (!result.allowed) {
      return NextResponse.json(
        {
          success: false,
          allowed: false,
          error: {
            code: result.reason ?? "SDK_ACCESS_DENIED",
            message: "SDK access validation failed",
          },
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      data: {
        allowedVersions: result.allowedVersions?.map((v) => v.version),
        recommendedVersion: result.recommendedVersion?.version,
        warning: result.warning,
      },
    });
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
