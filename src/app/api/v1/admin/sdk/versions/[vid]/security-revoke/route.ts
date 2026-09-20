import { NextRequest, NextResponse } from "next/server";
import { sdkVersionService } from "@/core/sdk/sdk-version.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/admin/sdk/versions/[vid]/security-revoke
 *
 * EMERGENCY: Security-revoke an SDK version with a known vulnerability.
 *
 * Effects:
 *   - Version is flagged isSecurityRevoked=true
 *   - NOT recommended for any new installations
 *   - High-priority warning shown in developer portal for users on this version
 *   - Existing customer access is NOT automatically revoked (per migration policy)
 *
 * This is distinct from normal deprecation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vid: string }> },
) {
  try {
    const { vid } = await params;
    const body = await req.json();

    if (!body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "reason is required for security revocation",
          },
        },
        { status: 400 },
      );
    }

    const version = await sdkVersionService.securityRevokeVersion(
      vid,
      body.reason,
    );

    return NextResponse.json({
      success: true,
      data: version,
      warning: `⚠️ SECURITY: Version ${version.version} has been security-revoked. Customers using this version will see a high-priority warning.`,
    });
  } catch (err: any) {
    const status = err instanceof AppError ? err.statusCode : 400;
    return NextResponse.json(
      {
        success: false,
        error: { code: err.errorCode ?? "BAD_REQUEST", message: err.message },
      },
      { status },
    );
  }
}
