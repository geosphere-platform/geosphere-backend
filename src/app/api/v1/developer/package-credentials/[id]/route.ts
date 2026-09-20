import { NextRequest, NextResponse } from "next/server";
import { packageAccessService } from "@/core/sdk/package-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * DELETE /api/v1/developer/package-credentials/[id]
 * Customer: revoke a package credential.
 * Subsequent downloads using the revoked token will be blocked.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const credential = await packageAccessService.revokeCredential(id, orgId);
    return NextResponse.json({
      success: true,
      data: credential,
      message:
        "Package credential revoked. New downloads using this token will be blocked.",
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
