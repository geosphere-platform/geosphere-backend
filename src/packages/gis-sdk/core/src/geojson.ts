import {
  GeoJSONFeature,
  GeoJSONFeatureCollection,
  GeoJSONGeometry,
} from "./types";
import { SDKError, SDKErrorCode } from "./errors";

export class GeoJSONUtil {
  public static isValidGeometry(geometry: any): boolean {
    if (!geometry || typeof geometry !== "object") return false;
    const validTypes = [
      "Point",
      "LineString",
      "Polygon",
      "MultiPoint",
      "MultiLineString",
      "MultiPolygon",
      "GeometryCollection",
    ];
    if (!validTypes.includes(geometry.type)) return false;
    if (geometry.type === "GeometryCollection") {
      return Array.isArray(geometry.geometries);
    }
    return Array.isArray(geometry.coordinates);
  }

  public static isValidFeature(feature: any): boolean {
    if (!feature || typeof feature !== "object") return false;
    if (feature.type !== "Feature") return false;
    return this.isValidGeometry(feature.geometry);
  }

  public static isValidFeatureCollection(fc: any): boolean {
    if (!fc || typeof fc !== "object") return false;
    if (fc.type !== "FeatureCollection") return false;
    if (!Array.isArray(fc.features)) return false;
    return fc.features.every((f: any) => this.isValidFeature(f));
  }

  public static parse(
    jsonString: string,
  ): GeoJSONFeature | GeoJSONFeatureCollection | GeoJSONGeometry {
    try {
      const parsed = JSON.parse(jsonString);
      if (
        parsed.type === "FeatureCollection" &&
        this.isValidFeatureCollection(parsed)
      ) {
        return parsed as GeoJSONFeatureCollection;
      }
      if (parsed.type === "Feature" && this.isValidFeature(parsed)) {
        return parsed as GeoJSONFeature;
      }
      if (this.isValidGeometry(parsed)) {
        return parsed as GeoJSONGeometry;
      }
      throw new Error("Invalid GeoJSON structure");
    } catch (err: any) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        `GeoJSON parsing failed: ${err.message}`,
      );
    }
  }

  public static stringify(
    geojson: GeoJSONFeature | GeoJSONFeatureCollection | GeoJSONGeometry,
  ): string {
    return JSON.stringify(geojson);
  }

  public static createFeature<P = Record<string, any>>(
    geometry: GeoJSONGeometry,
    properties: P = {} as P,
    id?: string | number,
  ): GeoJSONFeature<P> {
    if (!this.isValidGeometry(geometry)) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        "Cannot create feature with invalid geometry",
      );
    }
    return {
      type: "Feature",
      id,
      geometry,
      properties,
    };
  }

  public static createFeatureCollection<P = Record<string, any>>(
    features: GeoJSONFeature<P>[] = [],
  ): GeoJSONFeatureCollection<P> {
    return {
      type: "FeatureCollection",
      features,
    };
  }
}
