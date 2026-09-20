import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import {
  getRefreshTokenFromCookie,
  clearAuthCookies,
} from "@/core/auth/session";
import { db } from "@/database";
import { DrizzleSessionRepository } from "@/features/auth/infrastructure/drizzle-session.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { LogoutUseCase } from "@/features/auth/application/logout.usecase";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = getRefreshTokenFromCookie(req);
    const sessionRepo = new DrizzleSessionRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new LogoutUseCase(sessionRepo, auditRepo);
    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    await useCase.execute(refreshToken, ipAddress, userAgent);

    const response = ApiResponse.success({ message: "Logout successful" }, 200);

    clearAuthCookies(response);
    return response;
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
