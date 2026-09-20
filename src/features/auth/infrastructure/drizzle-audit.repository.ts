import { DatabaseClient } from "@/database";
import { auditLogsTable } from "@/database/schema";
import { IAuditLogRepository } from "../domain/repository.interface";
import { AuditLogEntity } from "../domain/entities";

export class DrizzleAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly db: DatabaseClient) {}

  async log(data: Omit<AuditLogEntity, "id" | "createdAt">): Promise<void> {
    await this.db.insert(auditLogsTable).values({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
    });
  }
}
