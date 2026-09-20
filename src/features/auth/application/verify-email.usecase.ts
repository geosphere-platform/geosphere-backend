import { hashPassword } from "@/core/auth/password";
import { BadRequestError, NotFoundError } from "@/core/errors/errors";
import {
  IUserRepository,
  IVerificationRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";

export class VerifyEmailUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationRepository: IVerificationRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(token: string): Promise<void> {
    const tokenHash = await hashPassword(token);
    const verification =
      await this.verificationRepository.findEmailVerification(tokenHash);

    if (!verification) {
      throw new NotFoundError("Invalid or expired email verification token");
    }

    if (verification.usedAt) {
      throw new BadRequestError(
        "Email verification token has already been used",
      );
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestError("Email verification token has expired");
    }

    await this.verificationRepository.markEmailVerificationUsed(
      verification.id,
    );
    await this.userRepository.update(verification.userId, {
      emailVerifiedAt: new Date(),
    });

    await this.auditRepository.log({
      userId: verification.userId,
      action: "EMAIL_VERIFIED",
      entityType: "USER",
      entityId: verification.userId,
      ipAddress: null,
      userAgent: null,
      metadata: null,
    });
  }
}
