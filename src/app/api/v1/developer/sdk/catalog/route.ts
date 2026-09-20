import { NextRequest, NextResponse } from "next/server";
import { licenseService } from "@/core/sdk/license.service";
import { sdkProductService } from "@/core/sdk/sdk-product.service";
import { sdkAccessService } from "@/core/sdk/sdk-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/sdk/catalog
 *
 * Returns the SDK products this organization is entitled to access.
 * Only returns ACTIVE (and DEPRECATED) products with active licenses.
 * Customers only see what they have licensed.
 */
export async function GET(req: NextRequest) {
  try {
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    // Get org licenses to determine entitled products
    const licenses = await licenseService.listLicenses(orgId);
    const activeLicenses = licenses.filter(
      (l) => l.status === "ACTIVE" || l.status === "PENDING",
    );

    if (activeLicenses.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No active SDK licenses found",
      });
    }

    // Resolve entitled product details
    const productIds = [...new Set(activeLicenses.map((l) => l.productId))];
    const products = await Promise.all(
      productIds.map(async (productId) => {
        try {
          const product = await sdkProductService.getProduct(productId);
          const license = activeLicenses.find((l) => l.productId === productId);
          return {
            ...product,
            licenseId: license?.id,
            licenseStatus: license?.status,
            licenseExpiresAt: license?.expiresAt,
          };
        } catch {
          return null;
        }
      }),
    );

    const catalog = products.filter(Boolean);
    return NextResponse.json({ success: true, data: catalog });
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
