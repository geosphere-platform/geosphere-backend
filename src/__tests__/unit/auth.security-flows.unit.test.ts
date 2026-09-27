import assert from "assert";
import { hashPassword, hashToken } from "@/core/auth/password";
import { USER_ROLES } from "@/core/constants";
import { UnauthorizedError } from "@/core/errors/errors";
import {
  IUserRepository,
  ISessionRepository,
  IVerificationRepository,
  IAuditLogRepository,
} from "@/features/auth/domain/repository.interface";
import {
  UserEntity,
  RefreshTokenEntity,
  EmailVerificationEntity,
  PasswordResetEntity,
  AuditLogEntity,
} from "@/features/auth/domain/entities";
import { LoginUseCase } from "@/features/auth/application/login.usecase";
import { RegisterUseCase } from "@/features/auth/application/register.usecase";
import { VerifyEmailUseCase } from "@/features/auth/application/verify-email.usecase";
import { ResetPasswordUseCase } from "@/features/auth/application/reset-password.usecase";
import { RefreshTokenUseCase } from "@/features/auth/application/refresh-token.usecase";

class MockUserRepository implements IUserRepository {
  public users = new Map<string, UserEntity>();

  async findByEmail(email: string): Promise<UserEntity | null> {
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase()) return u;
    }
    return null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.users.get(id) ?? null;
  }

  async create(data: Omit<UserEntity, "id" | "createdAt" | "updatedAt">): Promise<UserEntity> {
    const id = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date();
    const user: UserEntity = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const existing = this.users.get(id);
    if (!existing) throw new Error("User not found");
    const updated = { ...existing, ...data, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  async incrementFailedLogin(id: string): Promise<number> {
    const user = this.users.get(id);
    if (!user) return 0;
    user.failedLoginAttempts += 1;
    return user.failedLoginAttempts;
  }

  async resetFailedLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) user.failedLoginAttempts = 0;
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    const user = this.users.get(id);
    if (user) user.lockedUntil = until;
  }
}

class MockSessionRepository implements ISessionRepository {
  public tokens = new Map<string, RefreshTokenEntity>();

  async createRefreshToken(data: Omit<RefreshTokenEntity, "id" | "createdAt">): Promise<RefreshTokenEntity> {
    const id = `tok-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const token: RefreshTokenEntity = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.tokens.set(token.tokenHash, token);
    return token;
  }

  async findRefreshTokenByHash(hash: string): Promise<RefreshTokenEntity | null> {
    return this.tokens.get(hash) ?? null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    for (const t of this.tokens.values()) {
      if (t.id === id) t.revokedAt = new Date();
    }
  }

  async revokeTokenFamily(family: string): Promise<void> {
    for (const t of this.tokens.values()) {
      if (t.family === family) t.revokedAt = new Date();
    }
  }
}

class MockVerificationRepository implements IVerificationRepository {
  public emailVerifications = new Map<string, EmailVerificationEntity>();
  public passwordResets = new Map<string, PasswordResetEntity>();

  async createEmailVerification(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationEntity> {
    const record: EmailVerificationEntity = {
      id: `ev-${Date.now()}`,
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: new Date(),
    };
    this.emailVerifications.set(tokenHash, record);
    return record;
  }

  async findEmailVerification(tokenHash: string): Promise<EmailVerificationEntity | null> {
    return this.emailVerifications.get(tokenHash) ?? null;
  }

  async markEmailVerificationUsed(id: string): Promise<void> {
    for (const v of this.emailVerifications.values()) {
      if (v.id === id) v.usedAt = new Date();
    }
  }

  async createPasswordReset(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string | null,
  ): Promise<PasswordResetEntity> {
    const record: PasswordResetEntity = {
      id: `pr-${Date.now()}`,
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      ipAddress: ipAddress ?? null,
      createdAt: new Date(),
    };
    this.passwordResets.set(tokenHash, record);
    return record;
  }

  async findPasswordReset(tokenHash: string): Promise<PasswordResetEntity | null> {
    return this.passwordResets.get(tokenHash) ?? null;
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    for (const p of this.passwordResets.values()) {
      if (p.id === id) p.usedAt = new Date();
    }
  }
}

class MockAuditLogRepository implements IAuditLogRepository {
  public logs: Omit<AuditLogEntity, "id" | "createdAt">[] = [];
  async log(data: Omit<AuditLogEntity, "id" | "createdAt">): Promise<void> {
    this.logs.push(data);
  }
}

export async function runAuthSecurityFlowsUnitTests(): Promise<boolean> {
  // 1. Test hashToken Determinism (Fixes the non-deterministic Bcrypt bug)
  const token = "5f2a1b9c8d7e6f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a";
  const hash1 = hashToken(token);
  const hash2 = hashToken(token);
  assert.strictEqual(hash1, hash2, "hashToken must produce identical deterministic hashes for database lookup");
  assert.strictEqual(hash1.length, 64, "SHA-256 hash must be 64 characters hex");

  // 2. Test Registration Role Hardening (Prevent privilege escalation)
  const userRepo = new MockUserRepository();
  const sessionRepo = new MockSessionRepository();
  const verificationRepo = new MockVerificationRepository();
  const auditRepo = new MockAuditLogRepository();

  const registerUseCase = new RegisterUseCase(userRepo, verificationRepo, auditRepo);
  const regResult = await registerUseCase.execute({
    email: "operator@enterprise.com",
    password: "Password123!@#Secure",
    firstName: "John",
    lastName: "Doe",
    organizationId: null,
  });

  assert.strictEqual(regResult.user.role, USER_ROLES.VIEWER, "Registration must strictly default to VIEWER");
  assert.ok(regResult.verificationToken.length > 20, "Verification token must be generated");

  // 3. Test Email Verification via Deterministic Token Hash Lookup
  const verifyEmailUseCase = new VerifyEmailUseCase(userRepo, verificationRepo, auditRepo);
  await verifyEmailUseCase.execute(regResult.verificationToken);

  const verifiedUser = await userRepo.findById(regResult.user.id);
  assert.ok(verifiedUser?.emailVerifiedAt, "User email must be verified successfully via hashToken lookup");

  // 4. Test Login Backdoor Removal
  const loginUseCase = new LoginUseCase(userRepo, sessionRepo, auditRepo);
  let backdoorRejected = false;
  try {
    await loginUseCase.execute({ email: "admin", password: "12345678" });
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err.statusCode === 401 || err.errorCode === "UNAUTHORIZED") {
      backdoorRejected = true;
    } else {
      throw err;
    }
  }
  assert.strictEqual(backdoorRejected, true, "Hardcoded backdoor 'admin'/'12345678' must be rejected with UnauthorizedError");

  // 5. Test Legitimate Login & Session Creation
  const loginResult = await loginUseCase.execute({
    email: "operator@enterprise.com",
    password: "Password123!@#Secure",
  });
  assert.ok(loginResult.accessToken, "Access token issued");
  assert.ok(loginResult.refreshToken, "Refresh token issued");

  // 6. Test Refresh Token Rotation via Deterministic Hash Lookup
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, sessionRepo, auditRepo);
  const rotatedResult = await refreshTokenUseCase.execute(loginResult.refreshToken);
  assert.ok(rotatedResult.accessToken, "Rotated access token issued");
  assert.ok(rotatedResult.refreshToken, "New rotated refresh token issued");

  // Verify old refresh token cannot be reused
  let reuseRejected = false;
  try {
    await refreshTokenUseCase.execute(loginResult.refreshToken);
  } catch (err: any) {
    if (err instanceof UnauthorizedError || err.statusCode === 401 || err.errorCode === "UNAUTHORIZED") {
      reuseRejected = true;
    } else {
      throw err;
    }
  }
  assert.strictEqual(reuseRejected, true, "Reused refresh token must be rejected with UnauthorizedError");

  // 7. Test Password Reset Flow via Deterministic Token Hash Lookup
  const resetPasswordUseCase = new ResetPasswordUseCase(userRepo, verificationRepo, sessionRepo, auditRepo);
  const resetToken = "reset_token_test_1234567890abcdef1234567890abcdef";
  await verificationRepo.createPasswordReset(
    verifiedUser!.id,
    hashToken(resetToken),
    new Date(Date.now() + 3600000),
  );

  await resetPasswordUseCase.execute({
    token: resetToken,
    newPassword: "NewPassword123!@#Secure",
  });

  const reLogin = await loginUseCase.execute({
    email: "operator@enterprise.com",
    password: "NewPassword123!@#Secure",
  });
  assert.ok(reLogin.accessToken, "Login successful with newly reset password");

  return true;
}

if (process.argv[1]?.includes("auth.security-flows.unit.test")) {
  runAuthSecurityFlowsUnitTests()
    .then(() => console.log("Direct run passed!"))
    .catch((err) => {
      console.error("DIRECT RUN ERROR:", err);
      process.exit(1);
    });
}
