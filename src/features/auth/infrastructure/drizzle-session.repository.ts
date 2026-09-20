import { eq } from "drizzle-orm";
import { DatabaseClient } from "@/database";
import { refreshTokensTable } from "@/database/schema";
import { ISessionRepository } from "../domain/repository.interface";
import { RefreshTokenEntity } from "../domain/entities";

export class DrizzleSessionRepository implements ISessionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async createRefreshToken(
    data: Omit<RefreshTokenEntity, "id" | "createdAt">,
  ): Promise<RefreshTokenEntity> {
    const [inserted] = await this.db
      .insert(refreshTokensTable)
      .values({
        userId: data.userId,
        tokenHash: data.tokenHash,
        family: data.family,
        expiresAt: data.expiresAt,
        revokedAt: data.revokedAt,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();

    return this.mapToEntity(inserted);
  }

  async findRefreshTokenByHash(
    hash: string,
  ): Promise<RefreshTokenEntity | null> {
    const [token] = await this.db
      .select()
      .from(refreshTokensTable)
      .where(eq(refreshTokensTable.tokenHash, hash))
      .limit(1);

    return token ? this.mapToEntity(token) : null;
  }

  async revokeRefreshToken(id: string): Promise<void> {
    await this.db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, id));
  }

  async revokeTokenFamily(family: string): Promise<void> {
    await this.db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.family, family));
  }

  private mapToEntity(
    raw: typeof refreshTokensTable.$inferSelect,
  ): RefreshTokenEntity {
    return {
      id: raw.id,
      userId: raw.userId,
      tokenHash: raw.tokenHash,
      family: raw.family,
      expiresAt: raw.expiresAt,
      revokedAt: raw.revokedAt,
      ipAddress: raw.ipAddress,
      userAgent: raw.userAgent,
      createdAt: raw.createdAt,
    };
  }
}
