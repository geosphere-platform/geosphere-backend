/**
 * Spatial Data Service — Business-Agnostic Spatial Domain Service
 *
 * Coordinates repository operations, enforces server-side tenant boundaries,
 * performs RBAC permission checks, validates geometry & coordinate limits,
 * and formats structured domain errors.
 */

import {
  ISpatialRepository,
  BBoxQueryOptions,
  RadiusQueryOptions,
  SpatialGeometryQueryOptions,
  NearestQueryOptions,
  DistanceQueryOptions,
  SpatialQueryResult,
} from "../domain/spatial.repository.interface";
import { SpatialFeature, createSpatialFeature } from "../types/feature";
import { Geometry } from "../types/geometry";
import { UserRole, PERMISSIONS, Permission } from "../../constants";
import { hasPermission } from "../../auth/permissions";
import {
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  InvalidGeometryError,
  SpatialFeatureNotFoundError,
} from "../../errors/spatial-errors";
import {
  validateGeometry,
  validateSRID,
  validateCoordinate,
  validateBBox,
  validateRadius,
  validatePagination,
} from "../validation/spatial-validation";

export interface CreateFeatureInput<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
> {
  id?: string;
  type: string;
  geometry: Geometry;
  srid?: string;
  properties?: P;
  metadata?: M;
}

export interface UpdateFeatureInput<
  P extends Record<string, unknown> = Record<string, unknown>,
  M extends Record<string, unknown> = Record<string, unknown>,
> {
  geometry?: Geometry;
  properties?: P;
  metadata?: M;
}

export interface ServiceContext {
  tenantId: string;
  userId?: string;
  role?: UserRole;
}

export class SpatialDataService {
  constructor(private readonly repository: ISpatialRepository) {}

  private enforceTenantContext(context: ServiceContext): string {
    if (
      !context ||
      !context.tenantId ||
      typeof context.tenantId !== "string" ||
      context.tenantId.trim() === ""
    ) {
      throw new TenantAccessDeniedError(
        "Valid tenant context is required for all spatial operations",
      );
    }
    return context.tenantId;
  }

  private checkPermission(
    role: UserRole | undefined,
    permission: Permission,
  ): void {
    if (role && !hasPermission(role, permission)) {
      throw new UnauthorizedSpatialAccessError(
        `Insufficient role permissions. Required: '${permission}'`,
      );
    }
  }

  /**
   * Create a generic spatial feature
   */
  async createFeature(
    context: ServiceContext,
    input: CreateFeatureInput,
  ): Promise<SpatialFeature> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_CREATE);

    if (
      !input.type ||
      typeof input.type !== "string" ||
      input.type.trim() === ""
    ) {
      throw new InvalidGeometryError("Feature 'type' string is required");
    }

    validateSRID(input.srid);
    const validGeometry = validateGeometry(input.geometry);

    const feature = createSpatialFeature({
      id: input.id,
      tenantId,
      type: input.type.trim(),
      geometry: validGeometry,
      srid: "EPSG:4326",
      properties: input.properties ?? {},
      metadata: input.metadata ?? {},
      createdBy: context.userId,
    });

    return await this.repository.create(feature, context.userId);
  }

  /**
   * Read spatial feature by ID
   */
  async getFeatureById(
    context: ServiceContext,
    id: string,
  ): Promise<SpatialFeature> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    if (!id || typeof id !== "string") {
      throw new InvalidGeometryError("Feature ID parameter is required");
    }

    const feature = await this.repository.findById(id, tenantId);
    if (!feature) {
      throw new SpatialFeatureNotFoundError(id);
    }

    return feature;
  }

  /**
   * Update spatial feature
   */
  async updateFeature(
    context: ServiceContext,
    id: string,
    input: UpdateFeatureInput,
  ): Promise<SpatialFeature> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_UPDATE);

    if (!id || typeof id !== "string") {
      throw new InvalidGeometryError("Feature ID parameter is required");
    }

    if (input.geometry) {
      validateGeometry(input.geometry);
    }

    const updated = await this.repository.update(
      id,
      tenantId,
      {
        geometry: input.geometry,
        properties: input.properties,
        metadata: input.metadata,
      },
      context.userId,
    );

    if (!updated) {
      throw new SpatialFeatureNotFoundError(id);
    }

    return updated;
  }

  /**
   * Delete spatial feature
   */
  async deleteFeature(context: ServiceContext, id: string): Promise<boolean> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_DELETE);

    if (!id || typeof id !== "string") {
      throw new InvalidGeometryError("Feature ID parameter is required");
    }

    const deleted = await this.repository.delete(id, tenantId);
    if (!deleted) {
      throw new SpatialFeatureNotFoundError(id);
    }

    return true;
  }

  /**
   * List spatial features by tenant & optional type with pagination
   */
  async listFeatures(
    context: ServiceContext,
    type?: string,
    limit?: number,
    offset?: number,
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);
    const pag = validatePagination(limit, offset);

    return await this.repository.findByTenant(
      tenantId,
      type,
      pag.limit,
      pag.offset,
    );
  }

  /**
   * Bounding box search
   */
  async searchByBoundingBox(
    context: ServiceContext,
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    options?: {
      type?: string;
      simplifyTolerance?: number;
      limit?: number;
      offset?: number;
    },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    const validBBox = validateBBox(minLng, minLat, maxLng, maxLat);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: BBoxQueryOptions = {
      ...validBBox,
      type: options?.type,
      simplifyTolerance: options?.simplifyTolerance,
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findByBoundingBox(tenantId, queryOptions);
  }

  /**
   * Radius search
   */
  async searchByRadius(
    context: ServiceContext,
    lng: number,
    lat: number,
    radius: number,
    unit: string = "meters",
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    validateCoordinate([lng, lat]);
    const radiusMeters = validateRadius(radius, unit);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: RadiusQueryOptions = {
      lng,
      lat,
      radiusMeters,
      type: options?.type,
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findWithinRadius(tenantId, queryOptions);
  }

  /**
   * Intersection search
   */
  async searchIntersects(
    context: ServiceContext,
    geometry: Geometry,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    const validGeom = validateGeometry(geometry);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: SpatialGeometryQueryOptions = {
      geometry: validGeom,
      type: options?.type,
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findIntersects(tenantId, queryOptions);
  }

  /**
   * Containment search (ST_Contains)
   */
  async searchContains(
    context: ServiceContext,
    geometry: Geometry,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    const validGeom = validateGeometry(geometry);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: SpatialGeometryQueryOptions = {
      geometry: validGeom,
      type: options?.type,
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findContains(tenantId, queryOptions);
  }

  /**
   * Within search (ST_Within)
   */
  async searchWithin(
    context: ServiceContext,
    geometry: Geometry,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    const validGeom = validateGeometry(geometry);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: SpatialGeometryQueryOptions = {
      geometry: validGeom,
      type: options?.type,
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findWithin(tenantId, queryOptions);
  }

  /**
   * Nearest features KNN search
   */
  async searchNearest(
    context: ServiceContext,
    lng: number,
    lat: number,
    options?: { type?: string; limit?: number },
  ): Promise<SpatialQueryResult> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    validateCoordinate([lng, lat]);
    const pag = validatePagination(options?.limit ?? 10, 0);

    const queryOptions: NearestQueryOptions = {
      lng,
      lat,
      type: options?.type,
      limit: pag.limit,
    };

    return await this.repository.findNearest(tenantId, queryOptions);
  }

  /**
   * Spatial distance search with database-side sorting
   */
  async searchByDistance(
    context: ServiceContext,
    lng: number,
    lat: number,
    options?: {
      type?: string;
      order?: "asc" | "desc";
      limit?: number;
      offset?: number;
    },
  ): Promise<
    SpatialQueryResult<{ feature: SpatialFeature; distanceMeters: number }>
  > {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_READ);

    validateCoordinate([lng, lat]);
    const pag = validatePagination(options?.limit, options?.offset);

    const queryOptions: DistanceQueryOptions = {
      lng,
      lat,
      type: options?.type,
      order: options?.order ?? "asc",
      limit: pag.limit,
      offset: pag.offset,
    };

    return await this.repository.findByDistance(tenantId, queryOptions);
  }
}
