import { NextRequest, NextResponse } from "next/server";
import { db } from "@/database";
import { scopesTable } from "@/database/schema/developer-portal";

/**
 * GET /api/v1/developer/scopes
 * List all available system API scopes
 */
export async function GET(req: NextRequest) {
  try {
    const scopes = await db.select().from(scopesTable);

    return NextResponse.json({
      success: true,
      data: scopes,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SCOPES_FETCH_FAILED",
          message: err.message || "Failed to fetch API scopes",
        },
      },
      { status: 400 },
    );
  }
}
