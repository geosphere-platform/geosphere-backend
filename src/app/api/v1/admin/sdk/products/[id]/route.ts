import { NextRequest, NextResponse } from "next/server";
import { sdkProductService } from "@/core/sdk/sdk-product.service";
import { sdkVersionService } from "@/core/sdk/sdk-version.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/admin/sdk/products/[id]
 * Get SDK product by ID
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await sdkProductService.getProduct(id);
    const versions = await sdkVersionService.listVersionsByProduct(id);
    return NextResponse.json({ success: true, data: { ...product, versions } });
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
 * PATCH /api/v1/admin/sdk/products/[id]
 * Update SDK product metadata
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await sdkProductService.updateProduct(id, {
      name: body.name,
      description: body.description,
      packageScope: body.packageScope,
      metadata: body.metadata,
    });
    return NextResponse.json({ success: true, data: product });
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
