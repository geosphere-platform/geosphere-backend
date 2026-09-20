import { hashPassword } from "@/core/auth/password";
import { BadRequestError, NotFoundError } from "@/core/errors/errors";
import {
  IUserRepository,
  IVerificationRepository,
  ISessionRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";
import { ResetPasswordDtoType } from "../ui/dtos";

export class ResetPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationRepository: IVerificationRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    dto: ResetPasswordDtoType,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    const tokenHash = await hashPassword(dto.token);
    const resetRecord =
      await this.verificationRepository.findPasswordReset(tokenHash);

    if (!resetRecord) {
      throw new NotFoundError("Invalid or expired password reset token");
    }

    if (resetRecord.usedAt) {
      throw new BadRequestError("Password reset token has already been used");
    }

    if (resetRecord.expiresAt < new Date()) {
      throw new BadRequestError("Password reset token has expired");
    }

    const newPasswordHash = await hashPassword(dto.newPassword);
    await this.userRepository.update(resetRecord.userId, {
      passwordHash: newPasswordHash,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    await this.verificationRepository.markPasswordResetUsed(resetRecord.id);

    await this.auditRepository.log({
      userId: resetRecord.userId,
      action: "PASSWORD_RESET_SUCCESS",
      entityType: "USER",
      entityId: resetRecord.userId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: null,
    });
  }
}
