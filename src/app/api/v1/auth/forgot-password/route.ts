import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleVerificationRepository } from "@/features/auth/infrastructure/drizzle-verification.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { ForgotPasswordUseCase } from "@/features/auth/application/forgot-password.usecase";
import { ForgotPasswordDto } from "@/features/auth/ui/dtos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = ForgotPasswordDto.parse(body);

    const userRepo = new DrizzleUserRepository(db);
    const verificationRepo = new DrizzleVerificationRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new ForgotPasswordUseCase(
      userRepo,
      verificationRepo,
      auditRepo,
    );
    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    await useCase.execute(validated.email, ipAddress, userAgent);

    // OWASP compliance: Return uniform message to prevent email enumeration
    return ApiResponse.success(
      {
        message:
          "If an account with that email exists, password reset instructions have been sent.",
      },
      200,
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
