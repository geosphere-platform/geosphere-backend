/**
 * GIS Core — BoundingBox Abstraction
 *
 * Represents a 2D geographic bounding box: [minLongitude, minLatitude, maxLongitude, maxLatitude].
 * Provides geometric calculations, intersection checks, containment checks, and Polygon conversion.
 */

import {
  Geometry,
  Coordinate,
  PolygonGeometry,
  BoundingBoxTuple,
} from "../types/geometry";

export type { BoundingBoxTuple };

export class BoundingBox {
  public readonly minLongitude: number;
  public readonly minLatitude: number;
  public readonly maxLongitude: number;
  public readonly maxLatitude: number;

  constructor(minLng: number, minLat: number, maxLng: number, maxLat: number) {
    this.minLongitude = minLng;
    this.minLatitude = minLat;
    this.maxLongitude = maxLng;
    this.maxLatitude = maxLat;
    this.validate();
  }

  public get minLng(): number {
    return this.minLongitude;
  }
  public get minLat(): number {
    return this.minLatitude;
  }
  public get maxLng(): number {
    return this.maxLongitude;
  }
  public get maxLat(): number {
    return this.maxLatitude;
  }

  public validate(): void {
    if (
      isNaN(this.minLongitude) ||
      isNaN(this.minLatitude) ||
      isNaN(this.maxLongitude) ||
      isNaN(this.maxLatitude)
    ) {
      throw new Error("BoundingBox contains NaN values");
    }
    if (this.minLongitude < -180 || this.maxLongitude > 180) {
      throw new Error(
        `Invalid longitude range: [${this.minLongitude}, ${this.maxLongitude}]. Must be within [-180, 180]`,
      );
    }
    if (this.minLatitude < -90 || this.maxLatitude > 90) {
      throw new Error(
        `Invalid latitude range: [${this.minLatitude}, ${this.maxLatitude}]. Must be within [-90, 90]`,
      );
    }
    if (this.minLongitude > this.maxLongitude) {
      throw new Error(
        `minLongitude (${this.minLongitude}) cannot exceed maxLongitude (${this.maxLongitude})`,
      );
    }
    if (this.minLatitude > this.maxLatitude) {
      throw new Error(
        `minLatitude (${this.minLatitude}) cannot exceed maxLatitude (${this.maxLatitude})`,
      );
    }
  }

  /**
   * Check if a coordinate is inside the bounding box
   */
  public containsCoordinate(coord: Coordinate): boolean {
    const [lng, lat] = coord;
    return (
      lng >= this.minLongitude &&
      lng <= this.maxLongitude &&
      lat >= this.minLatitude &&
      lat <= this.maxLatitude
    );
  }

  /**
   * Check if this bounding box intersects with another bounding box
   */
  public intersects(other: BoundingBox): boolean {
    return !(
      other.minLongitude > this.maxLongitude ||
      other.maxLongitude < this.minLongitude ||
      other.minLatitude > this.maxLatitude ||
      other.maxLatitude < this.minLatitude
    );
  }

  /**
   * Expand bounding box to encompass another coordinate or bounding box
   */
  public expand(item: Coordinate | BoundingBox): BoundingBox {
    if (Array.isArray(item)) {
      const [lng, lat] = item;
      return new BoundingBox(
        Math.min(this.minLongitude, lng),
        Math.min(this.minLatitude, lat),
        Math.max(this.maxLongitude, lng),
        Math.max(this.maxLatitude, lat),
      );
    } else {
      return new BoundingBox(
        Math.min(this.minLongitude, item.minLongitude),
        Math.min(this.minLatitude, item.minLatitude),
        Math.max(this.maxLongitude, item.maxLongitude),
        Math.max(this.maxLatitude, item.maxLatitude),
      );
    }
  }

  public extend(item: Coordinate | BoundingBox): BoundingBox {
    return this.expand(item);
  }

  /**
   * Calculate center coordinate of bounding box
   */
  public center(): Coordinate {
    return [
      (this.minLongitude + this.maxLongitude) / 2,
      (this.minLatitude + this.maxLatitude) / 2,
    ];
  }

  /**
   * Convert bounding box into a 5-point closed GeoJSON Polygon geometry
   */
  public toPolygon(): PolygonGeometry {
    return {
      type: "Polygon",
      coordinates: [
        [
          [this.minLongitude, this.minLatitude],
          [this.maxLongitude, this.minLatitude],
          [this.maxLongitude, this.maxLatitude],
          [this.minLongitude, this.maxLatitude],
          [this.minLongitude, this.minLatitude], // Closed loop
        ],
      ],
    };
  }

  public toPolygonGeometry(): PolygonGeometry {
    return this.toPolygon();
  }

  /**
   * Convert to flat tuple: [minLng, minLat, maxLng, maxLat]
   */
  public toTuple(): [number, number, number, number] {
    return [
      this.minLongitude,
      this.minLatitude,
      this.maxLongitude,
      this.maxLatitude,
    ];
  }

  /**
   * Factory function from coordinate array or tuple
   */
  public static fromTuple(
    tuple: [number, number, number, number],
  ): BoundingBox {
    return new BoundingBox(tuple[0], tuple[1], tuple[2], tuple[3]);
  }

  /**
   * Factory function creating BoundingBox from an array of coordinates
   */
  public static fromCoordinates(coordinates: Coordinate[]): BoundingBox {
    if (!coordinates || coordinates.length === 0) {
      throw new Error("Cannot create BoundingBox from empty coordinate array");
    }

    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of coordinates) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    return new BoundingBox(minLng, minLat, maxLng, maxLat);
  }

  /**
   * Factory function creating BoundingBox from any GeoJSON Geometry
   */
  public static fromGeometry(geometry: Geometry): BoundingBox {
    let coords: Coordinate[] = [];
    switch (geometry.type) {
      case "Point":
        coords = [geometry.coordinates as Coordinate];
        break;
      case "MultiPoint":
      case "LineString":
        coords = geometry.coordinates as Coordinate[];
        break;
      case "MultiLineString":
      case "Polygon":
        coords = (geometry.coordinates as Coordinate[][]).flat();
        break;
      case "MultiPolygon":
        coords = (geometry.coordinates as Coordinate[][][]).flat(2);
        break;
    }
    if (coords.length === 0) return new BoundingBox(-180, -90, 180, 90);
    return BoundingBox.fromCoordinates(coords);
  }
}
