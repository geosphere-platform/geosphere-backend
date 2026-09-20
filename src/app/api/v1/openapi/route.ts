import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

/**
 * GET /api/v1/openapi
 * Returns the complete OpenAPI 3.0.3 specification for GeoSphere Platform.
 */
export async function GET() {
  try {
    const specPath = path.join(process.cwd(), "public", "openapi.json");
    if (!fs.existsSync(specPath)) {
      return NextResponse.json(
        { error: "OpenAPI specification not generated yet" },
        { status: 404 }
      );
    }

    const content = fs.readFileSync(specPath, "utf8");
    const json = JSON.parse(content);

    return NextResponse.json(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
