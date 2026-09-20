/**
 * Phase 16 — SDK Product Service
 *
 * Manages the lifecycle of SDK products. Platform admins only.
 *
 * Rules:
 *   - Products are NEVER deleted (audit trail preserved)
 *   - Products with ACTIVE or DEPRECATED status may have versions created
 *   - Only DRAFT or ACTIVE products may be moved to ACTIVE
 *   - RETIRED products cannot be made active again without admin override
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../../database";
import {
  sdkProductsTable,
  SdkProductRow,
  SdkProductStatus,
  SdkProductType,
  SDK_PRODUCT_STATUS,
  SDK_PRODUCT_TYPE,
} from "../../database/schema/sdk-distribution";
import {
  SdkProductNotFoundError,
  SdkAccessDeniedError,
} from "./sdk-error-codes";
import { BadRequestError, ConflictError } from "../errors/errors";

export interface CreateSdkProductInput {
  name: string;
  slug: string;
  description?: string;
  productType?: SdkProductType;
  packageScope?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateSdkProductInput {
  name?: string;
  description?: string;
  packageScope?: string;
  metadata?: Record<string, unknown>;
}

export class SdkProductService {
  /**
   * Create a new SDK product (DRAFT status initially)
   * Platform admin only.
   */
  async createProduct(input: CreateSdkProductInput): Promise<SdkProductRow> {
    const slug = input.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    // Check slug uniqueness
    const existing = await db
      .select({ id: sdkProductsTable.id })
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError(`SDK product with slug '${slug}' already exists`);
    }

    const [product] = await db
      .insert(sdkProductsTable)
      .values({
        name: input.name,
        slug,
        description: input.description ?? null,
        productType: input.productType ?? SDK_PRODUCT_TYPE.WEB_SDK,
        status: SDK_PRODUCT_STATUS.DRAFT,
        packageScope: input.packageScope ?? null,
        metadata: input.metadata ?? {},
      })
      .returning();

    return product;
  }

  /**
   * Get a single SDK product by ID
   */
  async getProduct(productId: string): Promise<SdkProductRow> {
    const [product] = await db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.id, productId))
      .limit(1);

    if (!product) {
      throw new SdkProductNotFoundError();
    }

    return product;
  }

  /**
   * Get a single SDK product by slug
   */
  async getProductBySlug(slug: string): Promise<SdkProductRow> {
    const [product] = await db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.slug, slug))
      .limit(1);

    if (!product) {
      throw new SdkProductNotFoundError(`SDK product '${slug}' not found`);
    }

    return product;
  }

  /**
   * List all SDK products (admin — all statuses)
   */
  async listAllProducts(): Promise<SdkProductRow[]> {
    return db
      .select()
      .from(sdkProductsTable)
      .orderBy(sql`${sdkProductsTable.createdAt} DESC`);
  }

  /**
   * List active SDK products visible to customers
   */
  async listActiveProducts(): Promise<SdkProductRow[]> {
    return db
      .select()
      .from(sdkProductsTable)
      .where(eq(sdkProductsTable.status, SDK_PRODUCT_STATUS.ACTIVE))
      .orderBy(sql`${sdkProductsTable.name} ASC`);
  }

  /**
   * Update product metadata/description (not slug, not status)
   */
  async updateProduct(
    productId: string,
    input: UpdateSdkProductInput,
  ): Promise<SdkProductRow> {
    const existing = await this.getProduct(productId);

    if (existing.status === SDK_PRODUCT_STATUS.RETIRED) {
      throw new SdkAccessDeniedError("Retired SDK products cannot be modified");
    }

    const [updated] = await db
      .update(sdkProductsTable)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.packageScope !== undefined && {
          packageScope: input.packageScope,
        }),
        ...(input.metadata !== undefined && { metadata: input.metadata }),
        updatedAt: new Date(),
      })
      .where(eq(sdkProductsTable.id, productId))
      .returning();

    return updated;
  }

  /**
   * Publish a DRAFT product to ACTIVE status
   */
  async publishProduct(productId: string): Promise<SdkProductRow> {
    const existing = await this.getProduct(productId);

    if (existing.status !== SDK_PRODUCT_STATUS.DRAFT) {
      throw new BadRequestError(
        `Only DRAFT products can be published. Current status: ${existing.status}`,
      );
    }

    const [updated] = await db
      .update(sdkProductsTable)
      .set({ status: SDK_PRODUCT_STATUS.ACTIVE, updatedAt: new Date() })
      .where(eq(sdkProductsTable.id, productId))
      .returning();

    return updated;
  }

  /**
   * Deprecate an ACTIVE product
   * Deprecated products remain accessible but no new licenses are issued.
   */
  async deprecateProduct(productId: string): Promise<SdkProductRow> {
    const existing = await this.getProduct(productId);

    if (existing.status !== SDK_PRODUCT_STATUS.ACTIVE) {
      throw new BadRequestError(
        `Only ACTIVE products can be deprecated. Current status: ${existing.status}`,
      );
    }

    const [updated] = await db
      .update(sdkProductsTable)
      .set({ status: SDK_PRODUCT_STATUS.DEPRECATED, updatedAt: new Date() })
      .where(eq(sdkProductsTable.id, productId))
      .returning();

    return updated;
  }

  /**
   * Retire a product (DEPRECATED → RETIRED)
   * Retired products are no longer available for any access.
   * This is irreversible via normal operations.
   */
  async retireProduct(productId: string): Promise<SdkProductRow> {
    const existing = await this.getProduct(productId);

    if (existing.status !== SDK_PRODUCT_STATUS.DEPRECATED) {
      throw new BadRequestError(
        `Only DEPRECATED products can be retired. Deprecate first. Current status: ${existing.status}`,
      );
    }

    const [updated] = await db
      .update(sdkProductsTable)
      .set({ status: SDK_PRODUCT_STATUS.RETIRED, updatedAt: new Date() })
      .where(eq(sdkProductsTable.id, productId))
      .returning();

    return updated;
  }
}

export const sdkProductService = new SdkProductService();
