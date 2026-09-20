import { eq } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { usersTable } from "@/database/schema";
import { IUserRepository } from "../domain/repository.interface";
import { UserEntity } from "../domain/entities";
import { UserRole } from "@/core/constants";

export class DrizzleUserRepository implements IUserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    return user ? this.mapToEntity(user) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const [user] = await this.db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    return user ? this.mapToEntity(user) : null;
  }

  async create(
    data: Omit<UserEntity, "id" | "createdAt" | "updatedAt">,
  ): Promise<UserEntity> {
    const [inserted] = await this.db
      .insert(usersTable)
      .values({
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        organizationId: data.organizationId,
        emailVerifiedAt: data.emailVerifiedAt,
        isActive: data.isActive,
        failedLoginAttempts: data.failedLoginAttempts,
        lockedUntil: data.lockedUntil,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async update(id: string, data: Partial<UserEntity>): Promise<UserEntity> {
    const [updated] = await this.db
      .update(usersTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(usersTable.id, id))
      .returning();

    return this.mapToEntity(updated);
  }

  async incrementFailedLogin(id: string): Promise<number> {
    const user = await this.findById(id);
    if (!user) return 0;

    const newAttempts = user.failedLoginAttempts + 1;
    await this.db
      .update(usersTable)
      .set({ failedLoginAttempts: newAttempts, updatedAt: new Date() })
      .where(eq(usersTable.id, id));

    return newAttempts;
  }

  async resetFailedLogin(id: string): Promise<void> {
    await this.db
      .update(usersTable)
      .set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  async lockAccount(id: string, until: Date): Promise<void> {
    await this.db
      .update(usersTable)
      .set({ lockedUntil: until, updatedAt: new Date() })
      .where(eq(usersTable.id, id));
  }

  private mapToEntity(raw: typeof usersTable.$inferSelect): UserEntity {
    return {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      firstName: raw.firstName,
      lastName: raw.lastName,
      role: raw.role as UserRole,
      organizationId: raw.organizationId,
      emailVerifiedAt: raw.emailVerifiedAt,
      isActive: raw.isActive,
      failedLoginAttempts: raw.failedLoginAttempts,
      lockedUntil: raw.lockedUntil,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
