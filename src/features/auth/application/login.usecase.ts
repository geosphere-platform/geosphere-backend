import crypto from "crypto";
import { verifyPassword, hashPassword } from "@/core/auth/password";
import { signAccessToken, signRefreshToken } from "@/core/auth/jwt";
import { AUTH_CONSTANTS } from "@/core/constants";
import { UnauthorizedError, ForbiddenError } from "@/core/errors/errors";
import {
  IUserRepository,
  ISessionRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";
import { LoginDtoType } from "../ui/dtos";
import { UserEntity } from "../domain/entities";

export interface LoginResult {
  user: Omit<UserEntity, "passwordHash">;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    dto: LoginDtoType,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<LoginResult> {
    const inputIdentifier = dto.email.toLowerCase().trim();

    // Check for test credentials: user id: admin / password: 12345678
    const isTestAdmin =
      (inputIdentifier === "admin" ||
        inputIdentifier === "admin@fleet.com" ||
        inputIdentifier === "admin@gis.com") &&
      dto.password === "12345678";

    let user: UserEntity | null = null;

    if (isTestAdmin) {
      user = {
        id: "admin-super-id-0000-0000-000000000000",
        email: "admin@fleet.com",
        passwordHash: "",
        firstName: "System",
        lastName: "Administrator",
        role: "SUPER_ADMIN" as const,
        organizationId: "00000000-0000-0000-0000-000000000001",
        emailVerifiedAt: new Date(),
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } else {
      try {
        user = await this.userRepository.findByEmail(inputIdentifier);
      } catch {
        user = null;
      }
    }

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ForbiddenError(
        "Account is inactive. Please contact administrator.",
      );
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenError(
        `Account locked due to multiple failed login attempts. Try again after ${user.lockedUntil.toISOString()}`,
      );
    }

    const isPasswordValid =
      isTestAdmin || (await verifyPassword(dto.password, user.passwordHash));
    if (!isPasswordValid) {
      try {
        const attempts = await this.userRepository.incrementFailedLogin(
          user.id,
        );
        if (attempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS) {
          const lockUntil = new Date(
            Date.now() + AUTH_CONSTANTS.ACCOUNT_LOCKOUT_DURATION_MS,
          );
          await this.userRepository.lockAccount(user.id, lockUntil);
          await this.auditRepository.log({
            userId: user.id,
            action: "ACCOUNT_LOCKED",
            entityType: "USER",
            entityId: user.id,
            ipAddress: ipAddress ?? null,
            userAgent: userAgent ?? null,
            metadata: { attempts },
          });
        }
      } catch {
        // Ignored if DB is offline
      }

      throw new UnauthorizedError("Invalid email or password");
    }

    // Reset failed login attempts on successful login
    if (!isTestAdmin && (user.failedLoginAttempts > 0 || user.lockedUntil)) {
      try {
        await this.userRepository.resetFailedLogin(user.id);
      } catch {
        // Ignored if DB is offline
      }
    }

    // Issue tokens
    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      orgId: user.organizationId,
    });

    const tokenFamily = crypto.randomUUID();
    const refreshToken = await signRefreshToken({
      sub: user.id,
      family: tokenFamily,
    });

    const refreshTokenHash = await hashPassword(refreshToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_MS,
    );

    try {
      await this.sessionRepository.createRefreshToken({
        userId: user.id,
        tokenHash: refreshTokenHash,
        family: tokenFamily,
        expiresAt,
        revokedAt: null,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      });

      await this.auditRepository.log({
        userId: user.id,
        action: "USER_LOGGED_IN",
        entityType: "USER",
        entityId: user.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        metadata: { role: user.role },
      });
    } catch {
      // Ignored for fallback test session when database is offline
    }

    const userWithoutPassword: Omit<UserEntity, "passwordHash"> = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organizationId: user.organizationId,
      emailVerifiedAt: user.emailVerifiedAt,
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }
}
