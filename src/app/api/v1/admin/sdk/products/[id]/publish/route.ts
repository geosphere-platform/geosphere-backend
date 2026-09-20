import { NextRequest, NextResponse } from "next/server";
import { sdkProductService } from "@/core/sdk/sdk-product.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/admin/sdk/products/[id]/publish
 * Publish a DRAFT SDK product to ACTIVE status
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const product = await sdkProductService.publishProduct(id);
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
