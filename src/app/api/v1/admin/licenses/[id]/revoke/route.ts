import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/core/sdk/license.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/admin/licenses/[id]/revoke
 * Permanently revoke a license. This action is irreversible.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const performedBy = req.headers.get("x-user-id") || undefined;

    if (!body.reason) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "reason is required to revoke a license",
          },
        },
        { status: 400 },
      );
    }

    const license = await licenseService.revokeLicense(
      id,
      body.reason,
      performedBy,
    );
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
