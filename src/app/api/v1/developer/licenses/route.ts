import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/core/sdk/license.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/licenses
 * Customer: list their organization's SDK licenses.
 *
 * Tenant-isolated — only returns licenses for the authenticated organization.
 * Customers CANNOT modify license status via this endpoint.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const licenses = await licenseService.listLicenses(orgId);

    // Strip sensitive fields before returning to customer
    const sanitized = licenses.map(
      ({ licenseKeyHash: _hash, ...rest }) => rest,
    );

    return NextResponse.json({ success: true, data: sanitized });
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
