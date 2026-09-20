import { generateSecureToken, hashPassword } from "@/core/auth/password";
import { AUTH_CONSTANTS } from "@/core/constants";
import {
  IUserRepository,
  IVerificationRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";

export class ForgotPasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationRepository: IVerificationRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    email: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<string | null> {
    const user = await this.userRepository.findByEmail(email);

    // OWASP rule: Never reveal if email exists in system for security against enumeration
    if (!user || !user.isActive) {
      return null;
    }

    const resetToken = generateSecureToken();
    const tokenHash = await hashPassword(resetToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRES_MS,
    );

    await this.verificationRepository.createPasswordReset(
      user.id,
      tokenHash,
      expiresAt,
      ipAddress,
    );

    await this.auditRepository.log({
      userId: user.id,
      action: "PASSWORD_RESET_REQUESTED",
      entityType: "USER",
      entityId: user.id,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: null,
    });

    return resetToken;
  }
}
