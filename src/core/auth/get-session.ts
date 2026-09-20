import { NextRequest } from "next/server";
import { extractBearerToken } from "./session";
import { verifyAccessToken, AccessTokenPayload } from "./jwt";

/**
 * Extracts and verifies the access token from an incoming HTTP request.
 * Returns the decoded AccessTokenPayload if valid, or null if missing/invalid.
 */
export async function getSessionFromRequest(
  req: NextRequest,
): Promise<AccessTokenPayload | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  try {
    return await verifyAccessToken(token);
  } catch {
    return null;
  }
}
