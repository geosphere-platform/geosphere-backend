import { NextRequest, NextResponse } from "next/server";
import { apiKeyService } from "@/core/developer/api-key.service";

/**
 * GET /api/v1/developer/keys
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";
    const applicationId =
      req.nextUrl.searchParams.get("applicationId") || undefined;

    const keys = await apiKeyService.listApiKeys(orgId, applicationId);

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_KEY_LIST_FAILED",
          message: err.message || "Failed to list API keys",
        },
      },
      { status: 400 },
    );
  }
}

/**
 * POST /api/v1/developer/keys
 * Create a new API Key (Returns raw secret key ONCE)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if action parameter is included for rotate/revoke
    if (body.action === "rotate") {
      const orgId =
        req.headers.get("x-user-org-id") ||
        body.organizationId ||
        "00000000-0000-0000-0000-000000000001";
      const userId = req.headers.get("x-user-id") || undefined;

      const result = await apiKeyService.rotateApiKey(
        body.keyId,
        orgId,
        userId,
      );
      return NextResponse.json({
        success: true,
        data: {
          apiKey: result.apiKeyRecord,
          rawSecretKey: result.rawSecretKey,
        },
      });
    }

    if (body.action === "revoke") {
      const orgId =
        req.headers.get("x-user-org-id") ||
        body.organizationId ||
        "00000000-0000-0000-0000-000000000001";
      const userId = req.headers.get("x-user-id") || undefined;

      await apiKeyService.revokeApiKey(body.keyId, orgId, userId);
      return NextResponse.json({
        success: true,
        message: "API Key revoked successfully",
      });
    }

    // Default: Create API Key
    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";
    const createdBy = req.headers.get("x-user-id") || undefined;

    const result = await apiKeyService.createApiKey({
      applicationId: body.applicationId,
      organizationId: orgId,
      workspaceId: body.workspaceId,
      name: body.name,
      environment: body.environment,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      createdBy,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          apiKey: result.apiKeyRecord,
          rawSecretKey: result.rawSecretKey,
        },
      },
      { status: 201 },
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "API_KEY_ACTION_FAILED",
          message: err.message || "Failed to execute API Key action",
        },
      },
      { status: 400 },
    );
  }
}
