/**
 * RealtimeSpatialEngine — High-Level Facilitator Service
 *
 * Orchestrates location ingestion, subject CRUD, current state lookups,
 * location history ledger queries, map viewport bounding box searches, and real-time event subscriptions.
 */

import {
  IRealtimeSpatialRepository,
  HistoryQueryOptions,
  ViewportQueryOptions,
  EventQueryOptions,
} from "./realtime-spatial-repository.interface";
import {
  LocationIngestionService,
  IngestionResult,
} from "./location-ingestion.service";
import { IRealtimeEventPublisher } from "./realtime-event.publisher";
import {
  SpatialSubject,
  CreateSpatialSubjectInput,
  UpdateSpatialSubjectInput,
} from "./spatial-subject.model";
import {
  LocationUpdate,
  SpatialCurrentPosition,
  LocationHistoryRecord,
} from "./location-update.model";
import { SpatialEvent, RealtimeEventEnvelope } from "./spatial-event.model";
import { ServiceContext } from "../services/spatial-data.service";
import { UserRole, PERMISSIONS } from "../../constants";
import { hasPermission } from "../../auth/permissions";
import {
  UnauthorizedSpatialAccessError,
  TenantAccessDeniedError,
  SubscriptionDeniedError,
  SubjectNotFoundError,
} from "../../errors/spatial-errors";
import { BoundingBox } from "../bbox/bounding-box";

export class RealtimeSpatialEngine {
  constructor(
    private readonly repo: IRealtimeSpatialRepository,
    private readonly ingestionService: LocationIngestionService,
    private readonly publisher: IRealtimeEventPublisher,
  ) {}

  private enforceTenantContext(context: ServiceContext): string {
    if (
      !context ||
      !context.tenantId ||
      typeof context.tenantId !== "string" ||
      context.tenantId.trim() === ""
    ) {
      throw new TenantAccessDeniedError("Valid tenant context is required");
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

  // ───────────────────────────────────────────────────────────────────────────
  // SUBJECT MANAGEMENT
  // ───────────────────────────────────────────────────────────────────────────

  async createSubject(
    context: ServiceContext,
    input: Omit<CreateSpatialSubjectInput, "tenantId">,
  ): Promise<SpatialSubject> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_CREATE);
    return this.repo.createSubject({ ...input, tenantId });
  }

  async getSubject(
    context: ServiceContext,
    subjectId: string,
  ): Promise<SpatialSubject> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_READ);

    let subject = await this.repo.findSubjectById(subjectId, tenantId);
    if (!subject) {
      subject = await this.repo.findSubjectByExternalId(subjectId, tenantId);
    }
    if (!subject) {
      throw new SubjectNotFoundError(subjectId);
    }
    return subject;
  }

  async listSubjects(
    context: ServiceContext,
    options?: {
      type?: string;
      activeOnly?: boolean;
      limit?: number;
      offset?: number;
    },
  ): Promise<{ items: SpatialSubject[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_READ);
    return this.repo.listSubjects(tenantId, options);
  }

  async updateSubject(
    context: ServiceContext,
    subjectId: string,
    input: UpdateSpatialSubjectInput,
  ): Promise<SpatialSubject> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_UPDATE);
    const updated = await this.repo.updateSubject(subjectId, tenantId, input);
    if (!updated) throw new SubjectNotFoundError(subjectId);
    return updated;
  }

  async deleteSubject(
    context: ServiceContext,
    subjectId: string,
  ): Promise<boolean> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_FEATURE_DELETE);
    return this.repo.deleteSubject(subjectId, tenantId);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOCATION INGESTION
  // ───────────────────────────────────────────────────────────────────────────

  async ingestLocation(
    context: ServiceContext,
    update: LocationUpdate,
  ): Promise<IngestionResult> {
    this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_INGEST);
    return this.ingestionService.ingestLocation(context, update);
  }

  async ingestBatch(
    context: ServiceContext,
    updates: LocationUpdate[],
  ): Promise<{
    processed: number;
    accepted: number;
    results: IngestionResult[];
  }> {
    this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_INGEST);
    return this.ingestionService.ingestBatch(context, updates);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CURRENT POSITIONS & VIEWPORT SPATIAL SEARCH
  // ───────────────────────────────────────────────────────────────────────────

  async getCurrentPosition(
    context: ServiceContext,
    subjectId: string,
  ): Promise<SpatialCurrentPosition | null> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_READ);
    return this.repo.getCurrentPosition(subjectId, tenantId);
  }

  async listCurrentPositions(
    context: ServiceContext,
    options?: { type?: string; limit?: number; offset?: number },
  ): Promise<{ items: SpatialCurrentPosition[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_READ);
    return this.repo.listCurrentPositions(tenantId, options);
  }

  async queryViewportPositions(
    context: ServiceContext,
    bbox: BoundingBox,
    limit?: number,
  ): Promise<{
    featureCollection: { type: "FeatureCollection"; features: unknown[] };
    count: number;
  }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_READ);

    const positions = await this.repo.queryViewportPositions(tenantId, {
      bbox,
      limit,
    });

    const features = positions.map((pos) => ({
      type: "Feature" as const,
      id: pos.subjectId,
      geometry: pos.location,
      properties: {
        subjectId: pos.subjectId,
        tenantId: pos.tenantId,
        speed: pos.speed,
        heading: pos.heading,
        accuracy: pos.accuracy,
        source: pos.source,
        timestamp: pos.timestamp,
        ...pos.metadata,
      },
    }));

    const featureCollection = { type: "FeatureCollection" as const, features };
    return { featureCollection, count: positions.length };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // LOCATION HISTORY
  // ───────────────────────────────────────────────────────────────────────────

  async queryLocationHistory(
    context: ServiceContext,
    subjectId: string,
    options?: HistoryQueryOptions,
  ): Promise<{
    items: LocationHistoryRecord[];
    nextCursor?: string;
    total: number;
  }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_LOCATION_HISTORY);
    return this.repo.queryLocationHistory(subjectId, tenantId, options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // SPATIAL EVENTS
  // ───────────────────────────────────────────────────────────────────────────

  async querySpatialEvents(
    context: ServiceContext,
    options?: EventQueryOptions,
  ): Promise<{ items: SpatialEvent[]; total: number }> {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_EVENT_READ);
    return this.repo.querySpatialEvents(tenantId, options);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REAL-TIME EVENT STREAM SUBSCRIPTIONS
  // ───────────────────────────────────────────────────────────────────────────

  subscribeToChannel(
    context: ServiceContext,
    channel: string,
    listener: (envelope: RealtimeEventEnvelope) => void,
  ): () => void {
    const tenantId = this.enforceTenantContext(context);
    this.checkPermission(context.role, PERMISSIONS.GIS_REALTIME_SUBSCRIBE);

    // Channel tenant boundary check
    if (channel.startsWith("tenant:")) {
      const channelTenant = channel.substring("tenant:".length);
      if (channelTenant !== tenantId) {
        throw new SubscriptionDeniedError(channel);
      }
    }

    return this.publisher.subscribe(channel, listener);
  }
}
