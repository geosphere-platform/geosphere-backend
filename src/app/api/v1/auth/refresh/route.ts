import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import {
  getRefreshTokenFromCookie,
  setRefreshTokenCookie,
} from "@/core/auth/session";
import { UnauthorizedError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleSessionRepository } from "@/features/auth/infrastructure/drizzle-session.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { RefreshTokenUseCase } from "@/features/auth/application/refresh-token.usecase";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedError("Missing refresh token cookie");
    }

    const userRepo = new DrizzleUserRepository(db);
    const sessionRepo = new DrizzleSessionRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new RefreshTokenUseCase(userRepo, sessionRepo, auditRepo);
    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    const result = await useCase.execute(refreshToken, ipAddress, userAgent);

    const response = ApiResponse.success(
      {
        accessToken: result.accessToken,
      },
      200,
    );

    // Rotate refresh token cookie
    setRefreshTokenCookie(response, result.refreshToken);

    return response;
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
