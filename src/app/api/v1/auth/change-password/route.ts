import { ApiResponse } from "@/core/http/api-response";
import { withAuth, AuthContext } from "@/core/auth/guards";
import { db } from "@/database";
import { DrizzleUserRepository } from "@/features/auth/infrastructure/drizzle-user.repository";
import { DrizzleAuditLogRepository } from "@/features/auth/infrastructure/drizzle-audit.repository";
import { ChangePasswordUseCase } from "@/features/auth/application/change-password.usecase";
import { ChangePasswordDto } from "@/features/auth/ui/dtos";

export const POST = withAuth(async (ctx: AuthContext) => {
  const body = await ctx.request.json();
  const validated = ChangePasswordDto.parse(body);

  const userRepo = new DrizzleUserRepository(db);
  const auditRepo = new DrizzleAuditLogRepository(db);

  const useCase = new ChangePasswordUseCase(userRepo, auditRepo);
  const ipAddress =
    ctx.request.headers.get("x-forwarded-for") ??
    ctx.request.headers.get("x-real-ip");
  const userAgent = ctx.request.headers.get("user-agent");

  await useCase.execute(ctx.user.sub, validated, ipAddress, userAgent);

  return ApiResponse.success(
    { message: "Password successfully changed." },
    200,
  );
});
