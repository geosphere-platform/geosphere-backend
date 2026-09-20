/**
 * GIS Core — GeoJSON Specification Standard
 *
 * Standard GeoJSON types for interoperability across GIS layers and standard APIs.
 */

import { Geometry, BoundingBoxTuple } from "./geometry";

export type GeoJsonProperties = Record<string, unknown>;

export interface GeoJsonFeature<
  G extends Geometry = Geometry,
  P = GeoJsonProperties,
> {
  type: "Feature";
  id?: string | number;
  geometry: G;
  properties: P;
  bbox?: BoundingBoxTuple;
}

export interface GeoJsonFeatureCollection<
  G extends Geometry = Geometry,
  P = GeoJsonProperties,
> {
  type: "FeatureCollection";
  features: GeoJsonFeature<G, P>[];
  bbox?: BoundingBoxTuple;
}
