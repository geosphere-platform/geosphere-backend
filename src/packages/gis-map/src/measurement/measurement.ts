/**
 * GIS Map SDK — Geospatial Measurement Engine
 *
 * Accurately calculates geodesic distances and spherical polygon areas on EPSG:4326/EPSG:3857.
 */

import {
  MeasurementUnitLength,
  MeasurementUnitArea,
  MeasurementResult,
  Geometry,
  Coordinate,
} from "../types";
import { calculateDistance } from "../../../../core/gis/utils/spatial-utils";

export class MeasurementEngine {
  /**
   * Calculates geodesic distance along a sequence of coordinates.
   * Accuracy: Great-circle Haversine formula (WGS84 ellipsoid approximation, error < 0.3%).
   */
  public static measureDistance(
    coordinates: Coordinate[],
    unit: MeasurementUnitLength = "meters",
  ): MeasurementResult {
    let totalMeters = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      totalMeters += calculateDistance(coordinates[i], coordinates[i + 1]);
    }

    let value = totalMeters;
    let suffix = "m";

    if (unit === "kilometers") {
      value = totalMeters / 1000;
      suffix = "km";
    } else if (unit === "feet") {
      value = totalMeters * 3.28084;
      suffix = "ft";
    } else if (unit === "miles") {
      value = totalMeters / 1609.344;
      suffix = "mi";
    }

    const geometry: Geometry = {
      type: "LineString",
      coordinates,
    };

    return {
      value,
      unit,
      geometry,
      formatted: `${value.toFixed(2)} ${suffix}`,
    };
  }

  /**
   * Calculates spherical polygon area using Gauss's Area Formula on spherical coordinates.
   * Accuracy: Spherical excess approximation on WGS84 sphere (mean radius R = 6371008.8m).
   */
  public static measureArea(
    coordinates: Coordinate[][],
    unit: MeasurementUnitArea = "squareMeters",
  ): MeasurementResult {
    const ring = coordinates[0] || [];
    if (ring.length < 3) {
      return {
        value: 0,
        unit,
        geometry: { type: "Polygon", coordinates },
        formatted: `0 ${unit}`,
      };
    }

    const RAD = Math.PI / 180;
    const R = 6371008.8; // Earth mean radius in meters
    let totalArea = 0;

    if (ring.length > 2) {
      for (let i = 0; i < ring.length; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % ring.length];
        totalArea +=
          (p2[0] - p1[0]) *
          RAD *
          (2 + Math.sin(p1[1] * RAD) + Math.sin(p2[1] * RAD));
      }
      totalArea = Math.abs((totalArea * R * R) / 2);
    }

    let value = totalArea;
    let suffix = "m²";

    if (unit === "hectares") {
      value = totalArea / 10000;
      suffix = "ha";
    } else if (unit === "squareKilometers") {
      value = totalArea / 1000000;
      suffix = "km²";
    } else if (unit === "squareFeet") {
      value = totalArea * 10.7639;
      suffix = "ft²";
    } else if (unit === "squareMiles") {
      value = totalArea / 2589988.11;
      suffix = "mi²";
    }

    const geometry: Geometry = {
      type: "Polygon",
      coordinates,
    };

    return {
      value,
      unit,
      geometry,
      formatted: `${value.toFixed(2)} ${suffix}`,
    };
  }
}
