import { NextRequest, NextResponse } from "next/server";
import { applicationService } from "@/core/developer/application.service";

/**
 * GET /api/v1/developer/apps/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const appDetails = await applicationService.getApplicationDetails(
      id,
      orgId,
    );

    return NextResponse.json({
      success: true,
      data: appDetails,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPLICATION_NOT_FOUND",
          message: err.message || "Application not found",
        },
      },
      { status: 404 },
    );
  }
}

/**
 * PUT /api/v1/developer/apps/[id]
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";
    const updatedBy = req.headers.get("x-user-id") || undefined;

    const updated = await applicationService.updateApplication(
      id,
      orgId,
      {
        name: body.name,
        description: body.description,
        allowedOrigins: body.allowedOrigins,
        scopeCodes: body.scopeCodes,
      },
      updatedBy,
    );

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPLICATION_UPDATE_FAILED",
          message: err.message || "Failed to update application",
        },
      },
      { status: 400 },
    );
  }
}
