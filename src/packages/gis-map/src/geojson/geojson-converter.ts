/**
 * GIS Map SDK — GeoJSON Converters
 */

import {
  GeoJsonFeature,
  GeoJsonFeatureCollection,
} from "../../../../core/gis/types/geojson";
import { MapFeature, Geometry } from "../types";

export class GeoJsonConverter {
  public static featureToMapFeature(
    geoJsonFeature: GeoJsonFeature,
  ): MapFeature {
    return {
      id: String(
        geoJsonFeature.id ??
          `geojson-${Math.random().toString(36).substring(2, 9)}`,
      ),
      geometry: geoJsonFeature.geometry,
      properties: geoJsonFeature.properties ?? {},
    };
  }

  public static featureCollectionToMapFeatures(
    collection: GeoJsonFeatureCollection,
  ): MapFeature[] {
    return (collection.features || []).map((f) =>
      GeoJsonConverter.featureToMapFeature(f),
    );
  }

  public static mapFeatureToGeoJson(mapFeature: MapFeature): GeoJsonFeature {
    return {
      type: "Feature",
      id: mapFeature.id,
      geometry: mapFeature.geometry,
      properties: mapFeature.properties,
    };
  }

  public static mapFeaturesToGeoJsonCollection(
    mapFeatures: MapFeature[],
  ): GeoJsonFeatureCollection {
    return {
      type: "FeatureCollection",
      features: mapFeatures.map((f) => GeoJsonConverter.mapFeatureToGeoJson(f)),
    };
  }

  public static validateGeoJsonGeometry(geometry: Geometry): boolean {
    if (!geometry || !geometry.type) return false;
    const validTypes = [
      "Point",
      "MultiPoint",
      "LineString",
      "MultiLineString",
      "Polygon",
      "MultiPolygon",
      "GeometryCollection",
    ];
    if (!validTypes.includes(geometry.type)) return false;
    if ((geometry.type as string) === "GeometryCollection") {
      return Array.isArray((geometry as any).geometries);
    }
    return Array.isArray((geometry as any).coordinates);
  }
}
