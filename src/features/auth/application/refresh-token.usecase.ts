import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from "@/core/auth/jwt";
import { hashPassword } from "@/core/auth/password";
import { AUTH_CONSTANTS } from "@/core/constants";
import { UnauthorizedError } from "@/core/errors/errors";
import {
  IUserRepository,
  ISessionRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    incomingRefreshToken: string,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<RefreshTokenResult> {
    const payload = await verifyRefreshToken(incomingRefreshToken);
    const user = await this.userRepository.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedError("Invalid session");
    }

    const tokenHash = await hashPassword(incomingRefreshToken);
    const existingToken =
      await this.sessionRepository.findRefreshTokenByHash(tokenHash);

    // If token not found or already revoked -> reuse detected (security breach!)
    if (!existingToken || existingToken.revokedAt) {
      if (existingToken) {
        // Revoke the entire token family to protect user account
        await this.sessionRepository.revokeTokenFamily(existingToken.family);
        await this.auditRepository.log({
          userId: user.id,
          action: "REFRESH_TOKEN_REUSE_DETECTED",
          entityType: "SESSION",
          entityId: existingToken.id,
          ipAddress: ipAddress ?? null,
          userAgent: userAgent ?? null,
          metadata: { family: existingToken.family },
        });
      }
      throw new UnauthorizedError("Revoked or invalid refresh token");
    }

    // Revoke old single-use token
    await this.sessionRepository.revokeRefreshToken(existingToken.id);

    // Issue new access token and new rotated refresh token in same family
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      orgId: user.organizationId,
    });

    const newRefreshToken = await signRefreshToken({
      sub: user.id,
      family: existingToken.family,
    });

    const newRefreshTokenHash = await hashPassword(newRefreshToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_MS,
    );

    await this.sessionRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      family: existingToken.family,
      expiresAt,
      revokedAt: null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
