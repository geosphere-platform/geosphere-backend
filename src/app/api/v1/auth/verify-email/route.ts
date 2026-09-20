import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { BadRequestError } from "@/core/errors/errors";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleVerificationRepository } from "@/features/auth/infrastructure/drizzle-verification.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { VerifyEmailUseCase } from "@/features/auth/application/verify-email.usecase";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      throw new BadRequestError("Verification token parameter is required");
    }

    const userRepo = new DrizzleUserRepository(db);
    const verificationRepo = new DrizzleVerificationRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new VerifyEmailUseCase(
      userRepo,
      verificationRepo,
      auditRepo,
    );
    await useCase.execute(token);

    return ApiResponse.success(
      { message: "Email successfully verified." },
      200,
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
