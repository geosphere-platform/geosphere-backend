/**
 * GeofenceEngine — Generic Business-Agnostic Geofence Evaluation & Transition Engine
 *
 * Provides spatial relationship evaluation (INSIDE, OUTSIDE, BOUNDARY) for Points/Geometries
 * against geofence boundaries, state transition calculation (ENTER, EXIT, etc.),
 * generic SpatialTransitionEvent generation, and persisted geofence CRUD with tenant isolation.
 */

import { Geometry, Coordinate } from "../types/geometry";
import {
  PostGisOperationsRepository,
  GeofenceEntity,
} from "./postgis-operations.repository";
import { GeometryValidationService } from "./geometry-validation.service";
import { isPointInPolygon } from "../utils/spatial-utils";
import { UserRole, PERMISSIONS } from "../../constants";
import { hasPermission } from "../../auth/permissions";
import { ServiceContext } from "../services/spatial-data.service";
import {
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  GeofenceNotFoundError,
  InvalidGeometryError,
} from "../../errors/spatial-errors";

export type GeofenceState = "INSIDE" | "OUTSIDE" | "BOUNDARY";

export type GeofenceTransitionType =
  | "ENTER"
  | "EXIT"
  | "OUTSIDE_TO_BOUNDARY"
  | "BOUNDARY_TO_INSIDE"
  | "INSIDE_TO_BOUNDARY"
  | "BOUNDARY_TO_OUTSIDE"
  | "NO_CHANGE";

export interface SpatialTransitionEvent {
  id: string;
  tenantId: string;
  geofenceId: string;
  subjectId: string; // Business-agnostic generic ID (vehicle, driver, asset, employee, device)
  previousState: GeofenceState;
  currentState: GeofenceState;
  transition: GeofenceTransitionType;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface GeofenceEvaluationResult {
  geofenceId?: string;
  geofenceName?: string;
  state: GeofenceState;
  distanceToBoundaryMeters?: number;
  evaluatedAt: string;
}

const memoryGeofenceStore = new Map<string, GeofenceEntity>();

export class GeofenceEngine {
  constructor(
    private readonly repository: PostGisOperationsRepository,
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
        "Valid tenant context is required for geofence operations",
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

  /**
   * Evaluate state transition between previous state and current state
   */
  evaluateTransition(
    previousState: GeofenceState,
    currentState: GeofenceState,
  ): GeofenceTransitionType {
    if (previousState === currentState) return "NO_CHANGE";

    if (previousState === "OUTSIDE" && currentState === "INSIDE")
      return "ENTER";
    if (previousState === "INSIDE" && currentState === "OUTSIDE") return "EXIT";

    if (previousState === "OUTSIDE" && currentState === "BOUNDARY")
      return "OUTSIDE_TO_BOUNDARY";
    if (previousState === "BOUNDARY" && currentState === "INSIDE")
      return "BOUNDARY_TO_INSIDE";
    if (previousState === "INSIDE" && currentState === "BOUNDARY")
      return "INSIDE_TO_BOUNDARY";
    if (previousState === "BOUNDARY" && currentState === "OUTSIDE")
      return "BOUNDARY_TO_OUTSIDE";

    return "NO_CHANGE";
  }

  /**
   * Evaluate a point against a polygon/multipolygon geofence geometry
   */
  async evaluatePointAgainstGeofence(
    point: Geometry | Coordinate,
    geofence: Geometry | GeofenceEntity,
  ): Promise<GeofenceEvaluationResult> {
    let pointGeom: Geometry;
    if (Array.isArray(point)) {
      this.validator.validateCoordinate(point);
      pointGeom = { type: "Point", coordinates: point };
    } else {
      pointGeom = this.validator.validateStructure(point);
      if (pointGeom.type !== "Point") {
        throw new InvalidGeometryError(
          `Geofence point evaluation requires Point geometry, received '${pointGeom.type}'`,
        );
      }
    }

    let targetGeom: Geometry;
    let geofenceId: string | undefined;
    let geofenceName: string | undefined;

    if ("type" in geofence) {
      targetGeom = this.validator.validateStructure(geofence);
    } else {
      targetGeom = this.validator.validateStructure(geofence.geometry);
      geofenceId = geofence.id;
      geofenceName = geofence.name;
    }

    if (targetGeom.type !== "Polygon" && targetGeom.type !== "MultiPolygon") {
      throw new InvalidGeometryError(
        `Geofence boundary must be Polygon or MultiPolygon, received '${targetGeom.type}'`,
      );
    }

    const now = new Date().toISOString();

    // Database PostGIS evaluation
    const isContains = await this.repository.evaluateSpatialRelation(
      targetGeom,
      pointGeom,
      "contains",
    );
    const isTouches = await this.repository.evaluateSpatialRelation(
      targetGeom,
      pointGeom,
      "touches",
    );

    if (isTouches) {
      return {
        geofenceId,
        geofenceName,
        state: "BOUNDARY",
        evaluatedAt: now,
      };
    }

    if (isContains) {
      return {
        geofenceId,
        geofenceName,
        state: "INSIDE",
        evaluatedAt: now,
      };
    }

    // JS Fallback for point in polygon
    const [lng, lat] = pointGeom.coordinates as Coordinate;
    if (targetGeom.type === "Polygon") {
      const ring = (targetGeom.coordinates as Coordinate[][])[0];
      const isInside = isPointInPolygon(lat, lng, ring);
      return {
        geofenceId,
        geofenceName,
        state: isInside ? "INSIDE" : "OUTSIDE",
        evaluatedAt: now,
      };
    }

    return {
      geofenceId,
      geofenceName,
      state: "OUTSIDE",
      evaluatedAt: now,
    };
  }

  /**
   * Construct generic SpatialTransitionEvent
   */
  createTransitionEvent(
    context: ServiceContext,
    geofenceId: string,
    subjectId: string,
    previousState: GeofenceState,
    currentState: GeofenceState,
    metadata: Record<string, unknown> = {},
  ): SpatialTransitionEvent {
    const tenantId = this.enforceTenantContext(context);
    const transition = this.evaluateTransition(previousState, currentState);

    return {
      id: `ste_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      geofenceId,
      subjectId,
      previousState,
      currentState,
      transition,
      timestamp: new Date().toISOString(),
      metadata,
    };
  }

  /**
   * Evaluate subject point against all active tenant geofences using candidate filtering
   */
  async evaluatePointAgainstAllGeofences(
    context: ServiceContext,
    point: Geometry | Coordinate,
  ): Promise<GeofenceEvaluationResult[]> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GEOFENCE_READ);

    let [lng, lat]: [number, number] = [0, 0];
    if (Array.isArray(point)) {
      [lng, lat] = point;
    } else {
      [lng, lat] = point.coordinates as Coordinate;
    }

    const candidates = await this.repository.findGeofenceCandidatesForPoint(
      tenantId,
      lng,
      lat,
    );
    const allStored = Array.from(memoryGeofenceStore.values()).filter(
      (g) => g.tenantId === tenantId,
    );
    const candidateList = candidates.length > 0 ? candidates : allStored;

    const results: GeofenceEvaluationResult[] = [];
    for (const gf of candidateList) {
      const evalRes = await this.evaluatePointAgainstGeofence([lng, lat], gf);
      if (evalRes.state !== "OUTSIDE") {
        results.push(evalRes);
      }
    }

    return results;
  }

  /**
   * Create a new persisted geofence
   */
  async createGeofence(
    context: ServiceContext,
    name: string,
    geometry: Geometry,
    properties: Record<string, unknown> = {},
  ): Promise<GeofenceEntity> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GEOFENCE_CREATE);

    if (!name || typeof name !== "string" || name.trim() === "") {
      throw new InvalidGeometryError("Geofence 'name' is required");
    }

    const validGeom = this.validator.validateStructure(geometry);
    if (validGeom.type !== "Polygon" && validGeom.type !== "MultiPolygon") {
      throw new InvalidGeometryError(
        `Geofence boundary must be Polygon or MultiPolygon, received '${validGeom.type}'`,
      );
    }

    const created = await this.repository.createGeofence(
      tenantId,
      name.trim(),
      validGeom,
      properties,
      context.userId,
    );

    memoryGeofenceStore.set(created.id, created);
    return created;
  }

  /**
   * List geofences for tenant
   */
  async listGeofences(context: ServiceContext): Promise<GeofenceEntity[]> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GEOFENCE_READ);

    const memoryList = Array.from(memoryGeofenceStore.values()).filter(
      (g) => g.tenantId === tenantId,
    );
    return memoryList;
  }

  /**
   * Get geofence by ID
   */
  async getGeofenceById(
    context: ServiceContext,
    id: string,
  ): Promise<GeofenceEntity> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GEOFENCE_READ);

    const gf = memoryGeofenceStore.get(id);
    if (!gf || gf.tenantId !== tenantId) {
      throw new GeofenceNotFoundError(id);
    }
    return gf;
  }

  /**
   * Delete geofence by ID
   */
  async deleteGeofence(context: ServiceContext, id: string): Promise<boolean> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GEOFENCE_DELETE);

    const gf = memoryGeofenceStore.get(id);
    if (!gf || gf.tenantId !== tenantId) {
      throw new GeofenceNotFoundError(id);
    }

    memoryGeofenceStore.delete(id);
    return true;
  }
}
