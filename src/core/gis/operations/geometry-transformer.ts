/**
 * GeometryTransformer — Coordinate Reference System (CRS) Transformation Service
 *
 * Provides coordinate transformations between standard EPSG:4326 (WGS84 lon/lat)
 * and EPSG:3857 (Web Mercator meters), adhering to platform CRS requirements.
 */

import { Geometry, Coordinate } from "../types/geometry";
import { GeometryValidationService } from "./geometry-validation.service";
import { GIS_CONSTANTS } from "../../constants";

export type SupportedCRS = "EPSG:4326" | "EPSG:3857";

export class GeometryTransformer {
  constructor(private readonly validator: GeometryValidationService) {}

  /**
   * Convert EPSG:4326 lon/lat to EPSG:3857 meters
   */
  lonLatToMercator(coord: Coordinate): Coordinate {
    const [lon, lat, alt] = coord;
    const x = (lon * 20037508.34) / 180;
    let y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) / (Math.PI / 180);
    y = (y * 20037508.34) / 180;
    return alt !== undefined ? [x, y, alt] : [x, y];
  }

  /**
   * Convert EPSG:3857 meters to EPSG:4326 lon/lat
   */
  mercatorToLonLat(coord: Coordinate): Coordinate {
    const [x, y, alt] = coord;
    const lon = (x * 180) / 20037508.34;
    const lat =
      (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    return alt !== undefined ? [lon, lat, alt] : [lon, lat];
  }

  /**
   * Transform geometry between supported CRSs
   */
  transformCRS(
    geometry: Geometry,
    sourceCRS: SupportedCRS = "EPSG:4326",
    targetCRS: SupportedCRS = "EPSG:3857",
  ): Geometry {
    if (sourceCRS === targetCRS) return geometry;

    const validGeom = this.validator.validateStructure(geometry);
    const transformFn =
      sourceCRS === GIS_CONSTANTS.PROJECTION_WGS84 &&
      targetCRS === GIS_CONSTANTS.PROJECTION_MERCATOR
        ? (c: Coordinate) => this.lonLatToMercator(c)
        : (c: Coordinate) => this.mercatorToLonLat(c);

    switch (validGeom.type) {
      case "Point":
        return {
          type: "Point",
          coordinates: transformFn(validGeom.coordinates as Coordinate),
        };
      case "MultiPoint":
      case "LineString":
        return {
          type: validGeom.type,
          coordinates: (validGeom.coordinates as Coordinate[]).map(transformFn),
        };
      case "MultiLineString":
      case "Polygon":
        return {
          type: validGeom.type,
          coordinates: (validGeom.coordinates as Coordinate[][]).map((ring) =>
            ring.map(transformFn),
          ),
        };
      case "MultiPolygon":
        return {
          type: "MultiPolygon",
          coordinates: (validGeom.coordinates as Coordinate[][][]).map((poly) =>
            poly.map((ring) => ring.map(transformFn)),
          ),
        };
      default:
        return validGeom;
    }
  }
}
