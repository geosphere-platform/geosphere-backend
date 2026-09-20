/**
 * GIS Map SDK — Generic MapFeature Operations
 */

import { MapFeature, Geometry, FeatureStyle } from "../types";
import { isValidCoordinate } from "../../../../core/gis/types/geometry";
import { StructuredMapError } from "../errors/map-errors";

export function validateMapFeature(feature: MapFeature): void {
  if (!feature.id) {
    throw new StructuredMapError(
      "FEATURE_NOT_FOUND",
      "MapFeature must have a valid non-empty 'id'",
    );
  }
  if (!feature.geometry || !feature.geometry.type) {
    throw new StructuredMapError(
      "INVALID_GEOMETRY",
      `Feature '${feature.id}' has missing or invalid geometry`,
    );
  }

  // Validate coordinates based on geometry type
  if (feature.geometry.type === "Point") {
    if (!isValidCoordinate(feature.geometry.coordinates)) {
      throw new StructuredMapError(
        "INVALID_COORDINATE",
        `Point feature '${feature.id}' has invalid coordinates`,
        { coordinates: feature.geometry.coordinates },
      );
    }
  }
}

export function createMapFeature<
  P extends Record<string, unknown> = Record<string, unknown>,
>(
  id: string,
  geometry: Geometry,
  properties?: P,
  style?: FeatureStyle,
): MapFeature<P> {
  const feat: MapFeature<P> = {
    id,
    geometry,
    properties: properties ?? ({} as P),
    style,
    visible: true,
  };
  validateMapFeature(feat as MapFeature);
  return feat;
}
