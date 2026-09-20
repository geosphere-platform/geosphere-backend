import {
  UserEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
  AuditLogEntity,
} from "./entities";

export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  create(
    data: Omit<UserEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserEntity>;
  update(id: string, data: Partial<UserEntity>): Promise<UserEntity>;
  incrementFailedLogin(id: string): Promise<number>;
  resetFailedLogin(id: string): Promise<void>;
  lockAccount(id: string, until: Date): Promise<void>;
}

export interface ISessionRepository {
  createRefreshToken(
    data: Omit<RefreshTokenEntity, "id" | "createdAt">,
  ): Promise<RefreshTokenEntity>;
  findRefreshTokenByHash(hash: string): Promise<RefreshTokenEntity | null>;
  revokeRefreshToken(id: string): Promise<void>;
  revokeTokenFamily(family: string): Promise<void>;
}

export interface IVerificationRepository {
  createEmailVerification(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationEntity>;
  findEmailVerification(
    tokenHash: string,
  ): Promise<EmailVerificationEntity | null>;
  markEmailVerificationUsed(id: string): Promise<void>;

  createPasswordReset(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string | null,
  ): Promise<PasswordResetEntity>;
  findPasswordReset(tokenHash: string): Promise<PasswordResetEntity | null>;
  markPasswordResetUsed(id: string): Promise<void>;
}

export interface IAuditLogRepository {
  log(data: Omit<AuditLogEntity, "id" | "createdAt">): Promise<void>;
}
