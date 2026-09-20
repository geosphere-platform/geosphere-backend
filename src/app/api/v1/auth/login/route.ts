import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import {
  setRefreshTokenCookie,
  setAccessTokenCookie,
} from "@/core/auth/session";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleSessionRepository } from "@/features/auth/infrastructure/drizzle-session.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { LoginUseCase } from "@/features/auth/application/login.usecase";
import { LoginDto } from "@/features/auth/ui/dtos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = LoginDto.parse(body);

    const userRepo = new DrizzleUserRepository(db);
    const sessionRepo = new DrizzleSessionRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new LoginUseCase(userRepo, sessionRepo, auditRepo);
    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    const result = await useCase.execute(validated, ipAddress, userAgent);

    const response = ApiResponse.success(
      {
        user: result.user,
        accessToken: result.accessToken,
      },
      200,
    );

    // Set HttpOnly refresh token cookie & access token cookie
    setRefreshTokenCookie(response, result.refreshToken);
    setAccessTokenCookie(response, result.accessToken);

    return response;
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
