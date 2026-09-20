import { NextRequest } from "next/server";
import { ApiResponse } from "@/core/http/api-response";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleVerificationRepository } from "@/features/auth/infrastructure/drizzle-verification.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { RegisterUseCase } from "@/features/auth/application/register.usecase";
import { RegisterDto } from "@/features/auth/ui/dtos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = RegisterDto.parse(body);

    const userRepo = new DrizzleUserRepository(db);
    const verificationRepo = new DrizzleVerificationRepository(db);
    const auditRepo = new DrizzleAuditLogRepository(db);

    const useCase = new RegisterUseCase(userRepo, verificationRepo, auditRepo);
    const ipAddress =
      req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip");
    const userAgent = req.headers.get("user-agent");

    const result = await useCase.execute(validated, ipAddress, userAgent);

    return ApiResponse.success(
      {
        user: result.user,
        message: "Registration successful. Please verify your email.",
      },
      201,
    );
  } catch (err) {
    return ApiResponse.handle(err);
  }
}
