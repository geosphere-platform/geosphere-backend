import { verifyPassword, hashPassword } from "@/core/auth/password";
import { UnauthorizedError, NotFoundError } from "@/core/errors/errors";
import {
  IUserRepository,
  IAuditLogRepository,
} from "../domain/repository.interface";
import { ChangePasswordDtoType } from "../ui/dtos";

export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly auditRepository: IAuditLogRepository,
  ) {}

  async execute(
    userId: string,
    dto: ChangePasswordDtoType,
    ipAddress?: string | null,
    userAgent?: string | null,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const isValid = await verifyPassword(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newHash = await hashPassword(dto.newPassword);
    await this.userRepository.update(userId, {
      passwordHash: newHash,
    });

    await this.auditRepository.log({
      userId,
      action: "PASSWORD_CHANGED",
      entityType: "USER",
      entityId: userId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      metadata: null,
    });
  }
}
