import { eq } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import {
  emailVerificationsTable,
  passwordResetsTable,
} from "@/database/schema";
import { IVerificationRepository } from "../domain/repository.interface";
import {
  EmailVerificationEntity,
  PasswordResetEntity,
} from "../domain/entities";

export class DrizzleVerificationRepository implements IVerificationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async createEmailVerification(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationEntity> {
    const [inserted] = await this.db
      .insert(emailVerificationsTable)
      .values({
        userId,
        tokenHash,
        expiresAt,
      })
      .returning();

    return inserted;
  }

  async findEmailVerification(
    tokenHash: string,
  ): Promise<EmailVerificationEntity | null> {
    const [record] = await this.db
      .select()
      .from(emailVerificationsTable)
      .where(eq(emailVerificationsTable.tokenHash, tokenHash))
      .limit(1);

    return record ?? null;
  }

  async markEmailVerificationUsed(id: string): Promise<void> {
    await this.db
      .update(emailVerificationsTable)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationsTable.id, id));
  }

  async createPasswordReset(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
    ipAddress?: string | null,
  ): Promise<PasswordResetEntity> {
    const [inserted] = await this.db
      .insert(passwordResetsTable)
      .values({
        userId,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
      })
      .returning();

    return inserted;
  }

  async findPasswordReset(
    tokenHash: string,
  ): Promise<PasswordResetEntity | null> {
    const [record] = await this.db
      .select()
      .from(passwordResetsTable)
      .where(eq(passwordResetsTable.tokenHash, tokenHash))
      .limit(1);

    return record ?? null;
  }

  async markPasswordResetUsed(id: string): Promise<void> {
    await this.db
      .update(passwordResetsTable)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetsTable.id, id));
  }
}
