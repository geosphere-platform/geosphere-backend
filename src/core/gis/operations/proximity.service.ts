/**
 * ProximityService — Generic Proximity & Nearest Neighbor Search Engine
 *
 * Business-agnostic proximity search service enabling features within distance,
 * nearest N features, and distance queries against stored spatial features with tenant isolation.
 */

import {
  ISpatialRepository,
  RadiusQueryOptions,
  NearestQueryOptions,
  DistanceQueryOptions,
} from "../domain/spatial.repository.interface";
import { SpatialFeature } from "../types/feature";
import { Geometry, Coordinate } from "../types/geometry";
import { DistanceUnit } from "./spatial-measurement.service";
import { UserRole, PERMISSIONS } from "../../constants";
import { hasPermission } from "../../auth/permissions";
import { ServiceContext } from "../services/spatial-data.service";
import {
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  InvalidRadiusError,
  SpatialQueryTooLargeError,
} from "../../errors/spatial-errors";
import { GeometryValidationService } from "./geometry-validation.service";
import { SPATIAL_OPERATION_LIMITS } from "../../config/spatial-limits";

export interface ProximityFeatureResult {
  feature: SpatialFeature;
  distanceMeters: number;
}

export class ProximityService {
  constructor(
    private readonly spatialRepo: ISpatialRepository,
    private readonly validator: GeometryValidationService,
  ) {}

  private enforceTenantContext(context: ServiceContext): string {
    if (
      !context ||
      !context.tenantId ||
      typeof context.tenantId !== "string" ||
      context.tenantId.trim() === ""
    ) {
      throw new TenantAccessDeniedError(
        "Valid tenant context is required for proximity operations",
      );
    }
    return context.tenantId;
  }

  private checkPermission(
    role: UserRole | undefined,
    permission: (typeof PERMISSIONS)[keyof typeof PERMISSIONS],
  ): void {
    if (role && !hasPermission(role, permission)) {
      throw new UnauthorizedSpatialAccessError(
        `Insufficient role permissions. Required: '${permission}'`,
      );
    }
  }

  private extractCoordinates(
    location: Geometry | Coordinate,
  ): [number, number] {
    if (Array.isArray(location)) {
      this.validator.validateCoordinate(location);
      return [location[0], location[1]];
    }
    if (location.type === "Point") {
      this.validator.validateCoordinate(location.coordinates);
      const [lng, lat] = location.coordinates as Coordinate;
      return [lng, lat];
    }
    throw new InvalidRadiusError(
      "Proximity search location must be a Point geometry or [lng, lat] coordinate pair",
    );
  }

  /**
   * Find features within specified distance radius
   */
  async withinDistance(
    context: ServiceContext,
    location: Geometry | Coordinate,
    distance: number,
    unit: DistanceUnit = "meters",
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<SpatialFeature[]> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_SPATIAL_READ);

    const [lng, lat] = this.extractCoordinates(location);

    if (typeof distance !== "number" || isNaN(distance) || distance <= 0) {
      throw new InvalidRadiusError(
        "Proximity distance must be a positive number",
      );
    }

    let radiusMeters = distance;
    if (unit === "kilometers") radiusMeters = distance * 1000;
    if (unit === "miles") radiusMeters = distance * 1609.344;

    if (radiusMeters > SPATIAL_OPERATION_LIMITS.MAX_RADIUS_METERS) {
      throw new SpatialQueryTooLargeError(
        `Radius search distance (${radiusMeters} m) exceeds maximum platform limit of ${SPATIAL_OPERATION_LIMITS.MAX_RADIUS_METERS} meters`,
      );
    }

    const limit = Math.min(
      options?.limit ?? SPATIAL_OPERATION_LIMITS.DEFAULT_PAGE_LIMIT,
      SPATIAL_OPERATION_LIMITS.MAX_PAGE_LIMIT,
    );
    const queryOptions: RadiusQueryOptions = {
      lng,
      lat,
      radiusMeters,
      type: options?.type,
      limit,
      offset: options?.offset ?? 0,
    };

    const res = await this.spatialRepo.findWithinRadius(tenantId, queryOptions);
    return res.items;
  }

  /**
   * Find nearest 1 feature using KNN PostGIS query
   */
  async nearest(
    context: ServiceContext,
    location: Geometry | Coordinate,
    options?: { type?: string },
  ): Promise<ProximityFeatureResult | null> {
    const res = await this.nearestN(context, location, 1, options);
    return res.length > 0 ? res[0] : null;
  }

  /**
   * Find N nearest features ordered by distance
   */
  async nearestN(
    context: ServiceContext,
    location: Geometry | Coordinate,
    N: number = 10,
    options?: { type?: string },
  ): Promise<ProximityFeatureResult[]> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_SPATIAL_READ);

    const [lng, lat] = this.extractCoordinates(location);

    const limit = Math.min(
      Math.max(1, N),
      SPATIAL_OPERATION_LIMITS.MAX_NEAREST_LIMIT,
    );
    const queryOptions: NearestQueryOptions = {
      lng,
      lat,
      type: options?.type,
      limit,
    };

    const res = await this.spatialRepo.findNearest(tenantId, queryOptions);

    // Compute exact distance for each returned feature
    const distQuery: DistanceQueryOptions = {
      lng,
      lat,
      type: options?.type,
      order: "asc",
      limit,
      offset: 0,
    };

    const distRes = await this.spatialRepo.findByDistance(tenantId, distQuery);
    if (distRes.items && distRes.items.length > 0) {
      return distRes.items.map((item) => ({
        feature: item.feature,
        distanceMeters: item.distanceMeters,
      }));
    }

    return res.items.map((feat) => ({
      feature: feat,
      distanceMeters: 0,
    }));
  }

  /**
   * Calculate distance from location to specific target spatial feature ID
   */
  async distanceFrom(
    context: ServiceContext,
    location: Geometry | Coordinate,
    featureId: string,
  ): Promise<number | null> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_SPATIAL_READ);

    const targetFeature = await this.spatialRepo.findById(featureId, tenantId);
    if (!targetFeature) return null;

    const [lng, lat] = this.extractCoordinates(location);
    const pointGeom: Geometry = { type: "Point", coordinates: [lng, lat] };

    const nearestRes = await this.nearestN(context, pointGeom, 50, {
      type: targetFeature.type,
    });
    const match = nearestRes.find((item) => item.feature.id === featureId);
    return match ? match.distanceMeters : null;
  }
}
