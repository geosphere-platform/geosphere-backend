import { NextRequest, NextResponse } from "next/server";
import { sdkVersionService } from "@/core/sdk/sdk-version.service";
import { sdkProductService } from "@/core/sdk/sdk-product.service";
import { packageAccessService } from "@/core/sdk/package-access.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/developer/sdk/[productSlug]/versions
 * Customer: list available SDK versions for a product.
 *
 * Excludes DRAFT versions. Shows RELEASED, DEPRECATED, RETIRED (for migration).
 * Security-revoked versions are flagged with a warning.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ productSlug: string }> },
) {
  try {
    const { productSlug } = await params;
    const orgId =
      req.headers.get("x-user-org-id") ||
      req.nextUrl.searchParams.get("organizationId") ||
      "00000000-0000-0000-0000-000000000001";

    const product = await sdkProductService.getProductBySlug(productSlug);
    const versions = await sdkVersionService.listCustomerVersionsByProduct(
      product.id,
    );
    const latestStable = await sdkVersionService.getLatestStableVersion(
      product.id,
    );

    // Generate install instructions
    const installInstructions =
      await packageAccessService.generateInstallInstructions(
        orgId,
        "current",
        [`${product.packageScope ?? "@gis-platform"}/${product.slug}`],
        "PRODUCTION",
      );

    return NextResponse.json({
      success: true,
      data: {
        product,
        versions: versions.map((v) => ({
          ...v,
          isRecommended: v.id === latestStable?.id,
          securityWarning: v.isSecurityRevoked
            ? `⚠️ This version has a known security vulnerability. Upgrade to ${latestStable?.version ?? "latest"} immediately.`
            : null,
          migrationWarning:
            v.status === "DEPRECATED"
              ? `This version is deprecated. Migrate to ${v.recommendedVersion ?? latestStable?.version ?? "latest"}.`
              : null,
        })),
        recommendedVersion: latestStable,
        installInstructions,
      },
    });
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
