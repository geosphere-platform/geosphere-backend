/**
 * Phase 13 — FeatureService
 *
 * Platform admin operations for managing the feature registry.
 * Features are the stable commercial capability codes (GIS_MAP, REALTIME, etc.)
 * that are assigned to plans via plan_features.
 *
 * Rules:
 * - Feature codes are unique and stable
 * - Archiving a feature does not break plan references
 * - Customer admins may list available features; only platform admins may modify
 */

import { db } from "../../database";
import { featuresTable, FEATURE_STATUS } from "../../database/schema";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../errors/errors";
import type { CreateFeatureInput, UpdateFeatureInput } from "./types";
import type { FeatureRow } from "../../database/schema/subscription";

export class FeatureService {
  /** List all features */
  async listFeatures(statusFilter?: string): Promise<FeatureRow[]> {
    const features = await db.select().from(featuresTable);
    if (statusFilter) {
      return features.filter((f) => f.status === statusFilter);
    }
    return features;
  }

  /** List only ACTIVE features */
  async listActiveFeatures(): Promise<FeatureRow[]> {
    return db
      .select()
      .from(featuresTable)
      .where(eq(featuresTable.status, FEATURE_STATUS.ACTIVE));
  }

  /** Get a feature by code */
  async getFeature(code: string): Promise<FeatureRow> {
    const [feature] = await db
      .select()
      .from(featuresTable)
      .where(eq(featuresTable.code, code.toUpperCase()))
      .limit(1);

    if (!feature) throw new NotFoundError(`Feature '${code}' not found`);
    return feature;
  }

  /** Create a new feature */
  async createFeature(input: CreateFeatureInput): Promise<FeatureRow> {
    const [created] = await db
      .insert(featuresTable)
      .values({
        code: input.code.toUpperCase(),
        name: input.name,
        description: input.description ?? null,
        category: input.category ?? "CORE",
        status: FEATURE_STATUS.ACTIVE,
        metadata: input.metadata ?? {},
      })
      .returning();

    return created;
  }

  /** Update a feature's metadata */
  async updateFeature(
    code: string,
    input: UpdateFeatureInput,
  ): Promise<FeatureRow> {
    await this.getFeature(code); // ensure exists

    const [updated] = await db
      .update(featuresTable)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(featuresTable.code, code.toUpperCase()))
      .returning();

    return updated;
  }

  /** Archive a feature (soft delete — does not break plan references) */
  async archiveFeature(code: string): Promise<FeatureRow> {
    await this.getFeature(code);

    const [archived] = await db
      .update(featuresTable)
      .set({ status: FEATURE_STATUS.ARCHIVED, updatedAt: new Date() })
      .where(eq(featuresTable.code, code.toUpperCase()))
      .returning();

    return archived;
  }
}

export const featureService = new FeatureService();
