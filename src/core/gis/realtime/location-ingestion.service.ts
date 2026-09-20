/**
 * LocationIngestionService — Business-Agnostic Real-Time Location Ingestion Pipeline
 *
 * Pipeline Execution Steps:
 * 1. Authenticate & validate tenant context
 * 2. Resolve & validate spatial subject
 * 3. Validate coordinates & clock skew limits
 * 4. Normalize speed (meters/sec), heading (0-360 deg), and timestamp (UTC)
 * 5. Atomic position store update (with out-of-order timestamp suppression)
 * 6. Location history ledger append
 * 7. Candidate geofence query & transition detection via Phase 8 GeofenceEngine
 * 8. Generate & persist generic SpatialEvent payloads
 * 9. Publish real-time event envelope to RealtimeEventPublisher channel subscribers
 */

import { IRealtimeSpatialRepository } from "./realtime-spatial-repository.interface";
import {
  LocationUpdate,
  NormalizedLocationUpdate,
  SpatialCurrentPosition,
} from "./location-update.model";
import { SpatialEvent, RealtimeEventEnvelope } from "./spatial-event.model";
import { IRealtimeEventPublisher } from "./realtime-event.publisher";
import { GeofenceEngine, GeofenceState } from "../operations/geofence.engine";
import { PostGisOperationsRepository } from "../operations/postgis-operations.repository";
import { GeometryValidationService } from "../operations/geometry-validation.service";
import { ServiceContext } from "../services/spatial-data.service";
import { REALTIME_ENGINE_LIMITS } from "../../config/realtime-limits";
import {
  InvalidLocationError,
  InvalidTimestampError,
  SubjectNotFoundError,
  SubjectAccessDeniedError,
  TenantAccessDeniedError,
  BatchSizeExceededError,
} from "../../errors/spatial-errors";
import { PointGeometry } from "../types/geometry";
import { RuleExecutionService } from "../rules/engine/rule-execution.service";
import { RuleContext } from "../rules/types/rule.types";

export interface IngestionResult {
  accepted: boolean;
  subjectId: string;
  timestamp: string;
  currentPosition?: SpatialCurrentPosition;
  eventsEmitted: SpatialEvent[];
  staleUpdate?: boolean;
}

export class LocationIngestionService {
  constructor(
    private readonly repo: IRealtimeSpatialRepository,
    private readonly publisher: IRealtimeEventPublisher,
    private readonly geofenceEngine: GeofenceEngine,
    private readonly operationsRepo: PostGisOperationsRepository,
    private readonly validator: GeometryValidationService,
    private readonly ruleExecutionService?: RuleExecutionService,
  ) {}

  private enforceTenantContext(context: ServiceContext): string {
    if (
      !context ||
      !context.tenantId ||
      typeof context.tenantId !== "string" ||
      context.tenantId.trim() === ""
    ) {
      throw new TenantAccessDeniedError(
        "Valid tenant context is required for location ingestion",
      );
    }
    return context.tenantId;
  }

  /**
   * Validate and normalize an incoming location update
   */
  public normalizeLocationUpdate(
    tenantId: string,
    raw: LocationUpdate,
  ): NormalizedLocationUpdate {
    if (!raw || typeof raw !== "object") {
      throw new InvalidLocationError(
        "Location update must be a non-null object",
      );
    }
    if (
      !raw.subjectId ||
      typeof raw.subjectId !== "string" ||
      raw.subjectId.trim() === ""
    ) {
      throw new InvalidLocationError("Missing or invalid 'subjectId'");
    }

    // 1. Validate Coordinates
    this.validator.validateCoordinate([raw.longitude, raw.latitude]);

    // 2. Validate & Normalize Timestamp
    let timestampMs: number;
    if (typeof raw.timestamp === "number") {
      timestampMs = raw.timestamp;
    } else if (
      typeof raw.timestamp === "string" &&
      raw.timestamp.trim() !== ""
    ) {
      timestampMs = new Date(raw.timestamp).getTime();
    } else {
      timestampMs = Date.now();
    }

    if (isNaN(timestampMs)) {
      throw new InvalidTimestampError("Invalid timestamp format");
    }

    const now = Date.now();
    if (timestampMs > now + REALTIME_ENGINE_LIMITS.MAX_FUTURE_CLOCK_SKEW_MS) {
      throw new InvalidTimestampError(
        `Location timestamp is in the future beyond acceptable clock skew limit (${REALTIME_ENGINE_LIMITS.MAX_FUTURE_CLOCK_SKEW_MS / 60000} mins)`,
      );
    }
    if (timestampMs < now - REALTIME_ENGINE_LIMITS.MAX_PAST_CLOCK_SKEW_MS) {
      throw new InvalidTimestampError(
        "Location timestamp is older than acceptable retention boundary (30 days)",
      );
    }

    const timestampIso = new Date(timestampMs).toISOString();

    // 3. Normalize Optional Numeric Fields
    let accuracy: number | null = null;
    if (
      typeof raw.accuracy === "number" &&
      !isNaN(raw.accuracy) &&
      raw.accuracy >= 0
    ) {
      accuracy = Math.round(raw.accuracy * 100) / 100;
    }

    let altitude: number | null = null;
    if (typeof raw.altitude === "number" && !isNaN(raw.altitude)) {
      altitude = Math.round(raw.altitude * 100) / 100;
    }

    let speed: number | null = null;
    if (typeof raw.speed === "number" && !isNaN(raw.speed) && raw.speed >= 0) {
      speed = Math.round(raw.speed * 100) / 100;
    }

    let heading: number | null = null;
    if (typeof raw.heading === "number" && !isNaN(raw.heading)) {
      heading = ((raw.heading % 360) + 360) % 360; // Normalize to 0 - 360 degrees
    }

    const source = raw.source ? String(raw.source).toLowerCase() : "api";
    const metadata =
      raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {};

    const pointGeom: PointGeometry = {
      type: "Point",
      coordinates: [raw.longitude, raw.latitude],
    };

    return {
      subjectId: raw.subjectId,
      tenantId,
      coordinate: [raw.longitude, raw.latitude],
      location: pointGeom,
      timestamp: timestampIso,
      timestampMs,
      accuracy,
      altitude,
      speed,
      heading,
      source,
      metadata,
    };
  }

  /**
   * Process single location update through real-time pipeline
   */
  async ingestLocation(
    context: ServiceContext,
    update: LocationUpdate,
  ): Promise<IngestionResult> {
    const tenantId = this.enforceTenantContext(context);

    // Step 1: Normalize location payload
    const normalized = this.normalizeLocationUpdate(tenantId, update);

    // Step 2: Validate Subject existence & tenant ownership
    let subject = await this.repo.findSubjectById(
      normalized.subjectId,
      tenantId,
    );
    if (!subject) {
      subject = await this.repo.findSubjectByExternalId(
        normalized.subjectId,
        tenantId,
      );
    }
    if (!subject) {
      // Auto-provision default generic subject if external update arrives for new subject ID
      subject = await this.repo.createSubject({
        tenantId,
        type: "generic-subject",
        externalId: normalized.subjectId,
        name: `Subject ${normalized.subjectId.substr(0, 8)}`,
      });
    }

    if (subject.tenantId !== tenantId) {
      throw new SubjectAccessDeniedError(
        `Subject '${normalized.subjectId}' does not belong to tenant '${tenantId}'`,
      );
    }

    // Step 3: Append Location History Ledger
    await this.repo.appendLocationHistory(normalized);

    // Step 4: Atomic Current Position Upsert with Out-of-Order suppression
    const upsertRes = await this.repo.upsertCurrentPosition(normalized);

    const emittedEvents: SpatialEvent[] = [];

    // Step 5: Construct & Persist `LOCATION_UPDATED` Event
    const locEvent: SpatialEvent = await this.repo.saveSpatialEvent({
      tenantId,
      type: "LOCATION_UPDATED",
      subjectId: subject.id,
      geometry: normalized.location,
      timestamp: normalized.timestamp,
      source: normalized.source,
      metadata: {
        coordinate: normalized.coordinate,
        speed: normalized.speed,
        heading: normalized.heading,
        accuracy: normalized.accuracy,
        stale: upsertRes.stale,
      },
    });
    emittedEvents.push(locEvent);

    // Publish Realtime Envelope for LOCATION_UPDATED
    const locEnvelope: RealtimeEventEnvelope = {
      eventId: locEvent.id,
      eventType: "LOCATION_UPDATED",
      timestamp: normalized.timestamp,
      tenantId,
      subjectId: subject.id,
      payload: {
        coordinate: normalized.coordinate,
        speed: normalized.speed,
        heading: normalized.heading,
        accuracy: normalized.accuracy,
        source: normalized.source,
      },
      version: 1,
    };
    await this.publisher.publish(locEnvelope);

    // Step 6: Spatial Geofence Candidate Evaluation & Transition Event Generation
    if (upsertRes.updated && !upsertRes.stale) {
      const [lng, lat] = normalized.coordinate;
      const activeGeofences =
        await this.operationsRepo.findGeofenceCandidatesForPoint(
          tenantId,
          lng,
          lat,
        );

      for (const geofence of activeGeofences) {
        const evalRes = await this.geofenceEngine.evaluatePointAgainstGeofence(
          normalized.coordinate,
          geofence.geometry,
        );

        const prevState: GeofenceState =
          (await this.repo.getGeofenceState(
            tenantId,
            subject.id,
            geofence.id,
          )) ?? "OUTSIDE";

        const transition = this.geofenceEngine.evaluateTransition(
          prevState,
          evalRes.state,
        );

        if (transition !== "NO_CHANGE") {
          await this.repo.setGeofenceState(
            tenantId,
            subject.id,
            geofence.id,
            evalRes.state,
          );

          const eventType =
            transition === "ENTER" || transition === "BOUNDARY_TO_INSIDE"
              ? "SPATIAL_ENTER"
              : transition === "EXIT" || transition === "BOUNDARY_TO_OUTSIDE"
                ? "SPATIAL_EXIT"
                : "LOCATION_UPDATED";

          const transEvent = await this.repo.saveSpatialEvent({
            tenantId,
            type: eventType,
            subjectId: subject.id,
            geometry: geofence.geometry,
            timestamp: normalized.timestamp,
            source: "geofence-engine",
            metadata: {
              geofenceId: geofence.id,
              geofenceName: geofence.name,
              previousState: prevState,
              currentState: evalRes.state,
              transition,
            },
          });
          emittedEvents.push(transEvent);

          // Publish Realtime Envelope for Geofence Transition Event
          const geofenceEnvelope: RealtimeEventEnvelope = {
            eventId: transEvent.id,
            eventType: eventType,
            timestamp: normalized.timestamp,
            tenantId,
            subjectId: subject.id,
            payload: {
              geofenceId: geofence.id,
              geofenceName: geofence.name,
              previousState: prevState,
              currentState: evalRes.state,
              transition,
              coordinate: normalized.coordinate,
            },
            version: 1,
          };
          await this.publisher.publish(geofenceEnvelope);
        }
      }
    }

    // Step 7: Trigger Automated Rule Engine Evaluation if rule service attached
    if (this.ruleExecutionService) {
      for (const ev of emittedEvents) {
        try {
          const ruleCtx: RuleContext = {
            event: {
              id: ev.id,
              type: ev.type,
              timestamp: ev.timestamp,
              source: ev.source,
              metadata: ev.metadata,
            },
            subject: {
              id: subject.id,
              type: subject.type,
              externalId: subject.externalId,
              name: subject.name,
              active: subject.active,
              attributes: (subject.metadata as any) ?? {},
            },
            location: {
              latitude: normalized.coordinate[1],
              longitude: normalized.coordinate[0],
              coordinate: [normalized.coordinate[0], normalized.coordinate[1]],
              speed: normalized.speed,
              heading: normalized.heading,
              accuracy: normalized.accuracy,
              timestamp: normalized.timestamp,
            },
            geofence: ev.metadata?.geofenceId
              ? {
                  id: String(ev.metadata.geofenceId),
                  name: String(ev.metadata.geofenceName ?? ""),
                  state: String(ev.metadata.currentState ?? ""),
                  previousState: String(ev.metadata.previousState ?? ""),
                  transition: String(ev.metadata.transition ?? ""),
                }
              : undefined,
            timestamp: normalized.timestamp,
          };

          await this.ruleExecutionService.evaluateEvent(
            context,
            {
              id: ev.id,
              type: ev.type as any,
              timestamp: ev.timestamp,
              subjectId: subject.id,
              source: ev.source,
              metadata: ev.metadata,
            },
            ruleCtx,
          );
        } catch (ruleErr) {
          // Rule evaluation failures do not fail location ingestion pipeline
        }
      }
    }

    return {
      accepted: true,
      subjectId: subject.id,
      timestamp: normalized.timestamp,
      currentPosition: upsertRes.position,
      eventsEmitted: emittedEvents,
      staleUpdate: upsertRes.stale,
    };
  }

  /**
   * Process batch location updates
   */
  async ingestBatch(
    context: ServiceContext,
    updates: LocationUpdate[],
  ): Promise<{
    processed: number;
    accepted: number;
    results: IngestionResult[];
  }> {
    if (!Array.isArray(updates)) {
      throw new InvalidLocationError(
        "Batch payload must be an array of location updates",
      );
    }
    if (updates.length > REALTIME_ENGINE_LIMITS.MAX_BATCH_INGESTION_SIZE) {
      throw new BatchSizeExceededError(
        REALTIME_ENGINE_LIMITS.MAX_BATCH_INGESTION_SIZE,
      );
    }

    const results: IngestionResult[] = [];
    let acceptedCount = 0;

    for (const update of updates) {
      try {
        const res = await this.ingestLocation(context, update);
        results.push(res);
        if (res.accepted) acceptedCount++;
      } catch (err) {
        results.push({
          accepted: false,
          subjectId: update.subjectId ?? "unknown",
          timestamp: new Date().toISOString(),
          eventsEmitted: [],
        });
      }
    }

    return {
      processed: updates.length,
      accepted: acceptedCount,
      results,
    };
  }
}
