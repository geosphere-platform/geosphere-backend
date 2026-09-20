import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleVerificationRepository } from "@/features/auth/infrastructure/drizzle-verification.repository";
import { DrizzleSessionRepository } from "@/features/auth/infrastructure/drizzle-session.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { ResetPasswordUseCase } from "@/features/auth/application/reset-password.usecase";
import { ResetPasswordDto } from "@/features/auth/ui/dtos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ResetPasswordDto.parse(body);

    const userRepo = new DrizzleUserRepository(db);
    const verificationRepo = new DrizzleVerificationRepository(db);
    const sessionRepo = new DrizzleSessionRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new ResetPasswordUseCase(
      userRepo,
      verificationRepo,
      sessionRepo,
      auditRepo,
    );

    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    await useCase.execute(validated, ipAddress, userAgent);

    return ApiResponse.success(
      { message: "Password has been successfully reset." },
      200,
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
