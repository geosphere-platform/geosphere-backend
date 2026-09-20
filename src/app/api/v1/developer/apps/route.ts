import { NextRequest, NextResponse } from "next/server";
import { applicationService } from "@/core/developer/application.service";

/**
 * GET /api/v1/developer/apps
 * List organization applications
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001"; // Fallback to default org in dev

    const environment = req.nextUrl.searchParams.get("environment") as any;
    const status = req.nextUrl.searchParams.get("status") || undefined;
    const workspaceId =
      req.nextUrl.searchParams.get("workspaceId") || undefined;

    const apps = await applicationService.listApplications(orgId, {
      environment,
      status,
      workspaceId,
    });

    return NextResponse.json({
      success: true,
      data: apps,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPLICATION_LIST_FAILED",
          message: err.message || "Failed to list applications",
        },
      },
      { status: 400 },
    );
  }
}

/**
 * POST /api/v1/developer/apps
 * Register a new application
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";
    const createdBy = req.headers.get("x-user-id") || undefined;

    const appDetails = await applicationService.createApplication({
      organizationId: orgId,
      workspaceId: body.workspaceId,
      name: body.name,
      description: body.description,
      type: body.type,
      environment: body.environment,
      allowedOrigins: body.allowedOrigins,
      scopeCodes: body.scopeCodes,
      createdBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: appDetails,
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPLICATION_CREATE_FAILED",
          message: err.message || "Failed to create application",
        },
      },
      { status: 400 },
    );
  }
}
