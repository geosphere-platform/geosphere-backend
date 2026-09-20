import { NextRequest, NextResponse } from "next/server";
import { sdkVersionService } from "@/core/sdk/sdk-version.service";
import { AppError } from "@/core/errors/errors";

/**
 * POST /api/v1/admin/sdk/versions/[vid]/release
 * Release an SDK version (DRAFT or RC → RELEASED).
 * After release, the version is IMMUTABLE.
 *
 * IMPORTANT: This endpoint is intended for CI/CD pipelines only.
 * Production releases require explicit approval — never triggered automatically.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ vid: string }> },
) {
  try {
    const { vid } = await params;
    const body = await req.json();

    if (!body.checksum) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "checksum is required to release an SDK version",
          },
        },
        { status: 400 },
      );
    }

    const version = await sdkVersionService.releaseVersion(vid, {
      checksum: body.checksum,
      commitSha: body.commitSha,
      buildTimestamp: body.buildTimestamp
        ? new Date(body.buildTimestamp)
        : undefined,
      releaseNotes: body.releaseNotes,
      artifactFileName: body.artifactFileName,
      artifactSizeBytes: body.artifactSizeBytes,
      registryRef: body.registryRef,
      apiCompatibility: body.apiCompatibility,
    });

    return NextResponse.json({
      success: true,
      data: version,
      message: `SDK version ${version.version} is now RELEASED and immutable`,
    });
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
