import { verifyRefreshToken } from "@/core/auth/jwt";
import { hashPassword } from "@/core/auth/password";
import {
  ISessionRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    refreshToken?: string | null,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    if (!refreshToken) return;

    try {
      const payload = await verifyRefreshToken(refreshToken);
      const tokenHash = await hashPassword(refreshToken);
      const session =
        await this.sessionRepository.findRefreshTokenByHash(tokenHash);

      if (session && !session.revokedAt) {
        await this.sessionRepository.revokeRefreshToken(session.id);
      }

      await this.auditRepository.log({
        userId: payload.sub,
        action: "USER_LOGGED_OUT",
        entityType: "USER",
        entityId: payload.sub,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        metadata: null,
      });
    } catch {
      // Ignore errors on logout to allow clean client logout
    }
  }
}
