import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/core/sdk/license.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/admin/licenses/[id]/activate
 * Activate a PENDING license
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const performedBy = req.headers.get("x-user-id") || undefined;
    const license = await licenseService.activateLicense(id, performedBy);
    return NextResponse.json({ success: true, data: license });
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
