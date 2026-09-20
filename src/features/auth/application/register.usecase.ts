import { hashPassword, generateSecureToken } from "@/core/auth/password";
import { AUTH_CONSTANTS } from "@/core/constants";
import { ConflictError } from "@/core/errors/errors";
import {
  IUserRepository,
  IVerificationRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";
import { RegisterDtoType } from "../ui/dtos";
import { UserEntity } from "../domain/entities";

export interface RegisterResult {
  user: Omit<UserEntity, "passwordHash">;
  verificationToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly verificationRepository: IVerificationRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    dto: RegisterDtoType,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<RegisterResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError("User with this email already exists");
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      organizationId: dto.organizationId ?? null,
      emailVerifiedAt: null,
      isActive: true,
      failedLoginAttempts: 0,
      lockedUntil: null,
    });

    // Generate email verification token
    const verificationToken = generateSecureToken();
    const tokenHash = await hashPassword(verificationToken);
    const expiresAt = new Date(
      Date.now() + AUTH_CONSTANTS.EMAIL_VERIFY_TOKEN_EXPIRES_MS,
    );

    await this.verificationRepository.createEmailVerification(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.auditRepository.log({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "USER",
      entityId: user.id,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: { email: user.email, role: user.role },
    });

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
      verificationToken,
    };
  }
}
