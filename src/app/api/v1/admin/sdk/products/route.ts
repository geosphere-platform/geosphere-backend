import { NextRequest, NextResponse } from "next/server";
import { sdkProductService } from "@/core/sdk/sdk-product.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/admin/sdk/products
 * List all SDK products (admin — all statuses)
 */
export async function GET(_req: NextRequest) {
  try {
    const products = await sdkProductService.listAllProducts();
    return NextResponse.json({ success: true, data: products });
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

/**
 * POST /api/v1/admin/sdk/products
 * Create a new SDK product
 * Requires platform admin authorization (enforced in production by auth middleware)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await sdkProductService.createProduct({
      name: body.name,
      slug: body.slug,
      description: body.description,
      productType: body.productType,
      packageScope: body.packageScope,
      metadata: body.metadata,
    });
    return NextResponse.json({ success: true, data: product }, { status: 201 });
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
