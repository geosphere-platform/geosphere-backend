/**
 * Shared API Singleton Dependencies for Real-Time Spatial Data & Event Engine
 */

import { db } from "@/database";
import { PostGisRealtimeSpatialRepository } from "@/core/gis/realtime/postgis-realtime-spatial.repository";
import { InMemoryRealtimeEventPublisher } from "@/core/gis/realtime/realtime-event.publisher";
import { PostGisOperationsRepository } from "@/core/gis/operations/postgis-operations.repository";
import { GeometryValidationService } from "@/core/gis/operations/geometry-validation.service";
import { GeofenceEngine } from "@/core/gis/operations/geofence.engine";
import { LocationIngestionService } from "@/core/gis/realtime/location-ingestion.service";
import { RealtimeSpatialEngine } from "@/core/gis/realtime/realtime-spatial.engine";
import { PostGisRulesRepository } from "@/core/gis/rules/repositories/postgis-rules.repository";
import { ActionExecutionService } from "@/core/gis/rules/actions/action-execution.service";
import { RuleExecutionService } from "@/core/gis/rules/engine/rule-execution.service";

export const realtimeRepo = new PostGisRealtimeSpatialRepository(db);
export const eventPublisher = new InMemoryRealtimeEventPublisher();
export const operationsRepo = new PostGisOperationsRepository(db);
export const validationService = new GeometryValidationService(operationsRepo);
export const geofenceEngine = new GeofenceEngine(
  operationsRepo,
  validationService,
);

const rulesRepo = new PostGisRulesRepository();
const actionExecutionService = new ActionExecutionService(
  rulesRepo,
  undefined,
  undefined,
  eventPublisher,
);
export const ruleExecutionService = new RuleExecutionService(
  rulesRepo,
  actionExecutionService,
);

export const ingestionService = new LocationIngestionService(
  realtimeRepo,
  eventPublisher,
  geofenceEngine,
  operationsRepo,
  validationService,
  ruleExecutionService,
);

export const realtimeEngine = new RealtimeSpatialEngine(
  realtimeRepo,
  ingestionService,
  eventPublisher,
);
