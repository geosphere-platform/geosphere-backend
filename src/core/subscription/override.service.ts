/**
 * Phase 13 — OverrideService
 *
 * Manages organization-level entitlement overrides for enterprise customers.
 *
 * Override priority (highest to lowest):
 *   1. Organization Override (this service) — HIGHEST
 *   2. Subscription Plan (planLimitsTable / planFeaturesTable)
 *   3. Default system config — LOWEST
 *
 * Security: Only PLATFORM_ADMIN users may create/modify/delete overrides.
 * Customer admins may only VIEW their effective entitlements.
 * All override changes must be audited via audit_logs.
 *
 * Use cases:
 *   - ENTERPRISE customer needs MAX_USERS=500 (plan default: 50)
 *   - Specific feature enabled for one org before general plan rollout
 *   - Feature disabled for an org due to compliance requirements
 */

import { db } from "../../database";
import {
  organizationEntitlementOverridesTable,
  OVERRIDE_TYPE,
} from "../../database/schema";
import { eq, and } from "drizzle-orm";
import { NotFoundError } from "../errors/errors";
import type {
  SetOverrideInput,
  OrganizationEntitlementOverrideRow,
} from "./types";
import type { OrganizationEntitlementOverrideRow as SchOverrideRow } from "../../database/schema/subscription";

export class OverrideService {
  /** Get all overrides for an organization */
  async getOrganizationOverrides(
    organizationId: string,
  ): Promise<SchOverrideRow[]> {
    return db
      .select()
      .from(organizationEntitlementOverridesTable)
      .where(
        eq(
          organizationEntitlementOverridesTable.organizationId,
          organizationId,
        ),
      );
  }

  /** Get a specific override by ID */
  async getOverride(id: string): Promise<SchOverrideRow> {
    const [override] = await db
      .select()
      .from(organizationEntitlementOverridesTable)
      .where(eq(organizationEntitlementOverridesTable.id, id))
      .limit(1);

    if (!override) throw new NotFoundError(`Override '${id}' not found`);
    return override;
  }

  /**
   * Set or update an entitlement override for an organization.
   * Uses upsert — existing overrides for the same org+resource+type are updated.
   *
   * Types:
   *   LIMIT           → numericValue + isUnlimited
   *   FEATURE_ENABLE  → isEnabled=true
   *   FEATURE_DISABLE → isEnabled=false
   */
  async setOverride(
    input: SetOverrideInput,
    createdBy: string,
  ): Promise<SchOverrideRow> {
    const [result] = await db
      .insert(organizationEntitlementOverridesTable)
      .values({
        organizationId: input.organizationId,
        resourceCode: input.resourceCode.toUpperCase(),
        overrideType: input.overrideType,
        numericValue: input.isUnlimited ? null : (input.numericValue ?? null),
        isUnlimited: input.isUnlimited ?? false,
        isEnabled: input.isEnabled ?? null,
        reason: input.reason ?? null,
        createdBy,
      })
      .onConflictDoUpdate({
        target: [
          organizationEntitlementOverridesTable.organizationId,
          organizationEntitlementOverridesTable.resourceCode,
          organizationEntitlementOverridesTable.overrideType,
        ],
        set: {
          numericValue: input.isUnlimited ? null : (input.numericValue ?? null),
          isUnlimited: input.isUnlimited ?? false,
          isEnabled: input.isEnabled ?? null,
          reason: input.reason ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result;
  }

  /** Remove an override by ID */
  async removeOverride(id: string): Promise<void> {
    await this.getOverride(id); // ensure exists
    await db
      .delete(organizationEntitlementOverridesTable)
      .where(eq(organizationEntitlementOverridesTable.id, id));
  }

  /** Remove all overrides for an organization */
  async removeAllOverrides(organizationId: string): Promise<void> {
    await db
      .delete(organizationEntitlementOverridesTable)
      .where(
        eq(
          organizationEntitlementOverridesTable.organizationId,
          organizationId,
        ),
      );
  }
}

export const overrideService = new OverrideService();
