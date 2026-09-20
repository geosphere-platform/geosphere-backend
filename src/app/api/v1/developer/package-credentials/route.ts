import { NextRequest, NextResponse } from "next/server";
import { packageAccessService } from "@/core/sdk/package-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/package-credentials
 * Customer: list package credentials for an application.
 * Never returns raw tokens or hashes — only prefix and metadata.
 *
 * POST /api/v1/developer/package-credentials
 * Customer: generate a scoped package credential.
 * Returns raw token ONCE — must be stored securely by customer.
 */

export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";
    const applicationId = req.nextUrl.searchParams.get("applicationId");

    if (!applicationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "applicationId query param required",
          },
        },
        { status: 400 },
      );
    }

    const credentials = await packageAccessService.listCredentials(
      applicationId,
      orgId,
    );
    return NextResponse.json({ success: true, data: credentials });
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
    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";
    const createdBy = req.headers.get("x-user-id") || undefined;

    if (!body.applicationId || !body.allowedPackages?.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "applicationId and allowedPackages are required",
          },
        },
        { status: 400 },
      );
    }

    const result = await packageAccessService.createCredential({
      organizationId: orgId,
      applicationId: body.applicationId,
      name:
        body.name || `Package Token — ${new Date().toISOString().slice(0, 10)}`,
      allowedPackages: body.allowedPackages,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      createdBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          credential: result.record,
          tokenPrefix: result.tokenPrefix,
          rawToken: result.rawToken,
          installConfig: result.installConfig,
          securityNotice:
            "Store the rawToken as an environment variable (GIS_PLATFORM_PACKAGE_TOKEN). It will NOT be shown again.",
        },
      },
      { status: 201 },
    );
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
