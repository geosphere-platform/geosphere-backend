import { NextRequest, NextResponse } from "next/server";
import { sdkAccessService } from "@/core/sdk/sdk-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/sdk/access
 * Customer: list SDK access grants for their organization.
 *
 * POST /api/v1/developer/sdk/access
 * Customer: request SDK access for an application under a license.
 */

export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const access = await sdkAccessService.listAccessForOrganization(orgId);
    return NextResponse.json({ success: true, data: access });
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.licenseId || !body.applicationId || !body.productId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "licenseId, applicationId, and productId are required",
          },
        },
        { status: 400 },
      );
    }

    const access = await sdkAccessService.grantAccess({
      licenseId: body.licenseId,
      applicationId: body.applicationId,
      productId: body.productId,
      versionPolicy: body.versionPolicy,
      versionConstraint: body.versionConstraint,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, data: access }, { status: 201 });
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
