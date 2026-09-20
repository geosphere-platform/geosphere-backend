import { NextRequest, NextResponse } from "next/server";
import { sdkVersionService } from "@/core/sdk/sdk-version.service";
import { AppError } from "@/core/errors/errors";

/**
 * GET /api/v1/admin/sdk/products/[id]/versions
 * List all versions for an SDK product (admin — all statuses)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const versions = await sdkVersionService.listVersionsByProduct(id);
    return NextResponse.json({ success: true, data: versions });
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
 * POST /api/v1/admin/sdk/products/[id]/versions
 * Create a new SDK version in DRAFT status
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const version = await sdkVersionService.createVersion({
      productId: id,
      version: body.version,
      channel: body.channel,
      preRelease: body.preRelease,
      minimumApiVersion: body.minimumApiVersion,
      maximumApiVersion: body.maximumApiVersion,
      packageName: body.packageName,
      packageRegistry: body.packageRegistry,
      releaseNotes: body.releaseNotes,
      packageMetadata: body.packageMetadata,
      commitSha: body.commitSha,
    });

    return NextResponse.json({ success: true, data: version }, { status: 201 });
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
