import { NextRequest, NextResponse } from "next/server";
import { applicationService } from "@/core/developer/application.service";

/**
 * POST /api/v1/developer/apps/[id]/actions
 * Body: { action: "suspend" | "reactivate" | "archive" }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const action = body.action;

    const orgId =
      req.headers.get("x-user-org-id") ||
      body.organizationId ||
      "00000000-0000-0000-0000-000000000001";
    const userId = req.headers.get("x-user-id") || undefined;

    if (action === "suspend") {
      const result = await applicationService.suspendApplication(
        id,
        orgId,
        userId,
      );
      return NextResponse.json({ success: true, data: result });
    } else if (action === "reactivate") {
      const result = await applicationService.reactivateApplication(
        id,
        orgId,
        userId,
      );
      return NextResponse.json({ success: true, data: result });
    } else if (action === "archive") {
      await applicationService.archiveApplication(id, orgId, userId);
      return NextResponse.json({
        success: true,
        message: "Application archived successfully",
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ACTION",
            message: `Unknown action: ${action}`,
          },
        },
        { status: 400 },
      );
    }
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "APPLICATION_ACTION_FAILED",
          message: err.message || "Failed to execute application action",
        },
      },
      { status: 400 },
    );
  }
}
