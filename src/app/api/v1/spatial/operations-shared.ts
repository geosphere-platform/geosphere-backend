/**
 * Operations Engine API Shared Instance Helper
 */

import { db } from "@/database";
import {
  PostGisOperationsRepository,
  GeometryValidationService,
  SpatialMeasurementService,
  SpatialOperationService,
  ProximityService,
  GeofenceEngine,
  GeometryTransformer,
} from "@/core/gis/operations";
import { PostGisSpatialRepository } from "@/core/gis/infrastructure/postgis-spatial.repository";

export const postGisOpsRepo = new PostGisOperationsRepository(db);
export const spatialRepo = new PostGisSpatialRepository(db);
export const validationService = new GeometryValidationService(postGisOpsRepo);
export const measurementService = new SpatialMeasurementService(
  postGisOpsRepo,
  validationService,
);
export const operationService = new SpatialOperationService(
  postGisOpsRepo,
  validationService,
  measurementService,
);
export const proximityService = new ProximityService(
  spatialRepo,
  validationService,
);
export const geofenceEngine = new GeofenceEngine(
  postGisOpsRepo,
  validationService,
);
export const geometryTransformer = new GeometryTransformer(validationService);
