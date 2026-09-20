/**
 * Pure Location Domain Validation & Quality Assessment Utilities
 *
 * Centralizes coordinate bounds checking, timestamp parsing, speed/heading normalization,
 * and location quality classification without UI dependencies.
 */

import {
  Location,
  LocationError,
  LocationQualityState,
  LocationSamplingOptions,
} from "../types/location.types";

export class LocationValidator {
  /**
   * Validates latitude range [-90, +90]
   */
  public static validateLatitude(latitude: number): void {
    if (typeof latitude !== "number" || isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new LocationError(
        "INVALID_LOCATION",
        `Invalid latitude value '${latitude}'. Latitude must be a number between -90 and +90.`
      );
    }
  }

  /**
   * Validates longitude range [-180, +180]
   */
  public static validateLongitude(longitude: number): void {
    if (typeof longitude !== "number" || isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new LocationError(
        "INVALID_LOCATION",
        `Invalid longitude value '${longitude}'. Longitude must be a number between -180 and +180.`
      );
    }
  }

  /**
   * Validates accuracy (must be >= 0 if provided)
   */
  public static validateAccuracy(accuracy?: number | null): void {
    if (accuracy !== undefined && accuracy !== null) {
      if (typeof accuracy !== "number" || isNaN(accuracy) || accuracy < 0) {
        throw new LocationError(
          "INVALID_LOCATION",
          `Invalid accuracy '${accuracy}'. Accuracy must be a non-negative number.`
        );
      }
    }
  }

  /**
   * Validates speed (must be >= 0 if provided)
   */
  public static validateSpeed(speed?: number | null): void {
    if (speed !== undefined && speed !== null) {
      if (typeof speed !== "number" || isNaN(speed) || speed < 0) {
        throw new LocationError(
          "INVALID_LOCATION",
          `Invalid speed '${speed}'. Speed must be a non-negative number.`
        );
      }
    }
  }

  /**
   * Normalizes heading to [0, 360) degrees
   */
  public static normalizeHeading(heading?: number | null): number | null {
    if (heading === undefined || heading === null) return null;
    if (typeof heading !== "number" || isNaN(heading)) {
      throw new LocationError(
        "INVALID_LOCATION",
        `Invalid heading value '${heading}'. Heading must be a valid number.`
      );
    }
    let normalized = heading % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  }

  /**
   * Validates and parses timestamp into epoch milliseconds
   */
  public static parseTimestampMs(timestamp: string | number): number {
    let ms: number;
    if (typeof timestamp === "number") {
      ms = timestamp;
    } else if (typeof timestamp === "string") {
      ms = Date.parse(timestamp);
    } else {
      throw new LocationError(
        "INVALID_LOCATION",
        "Invalid timestamp parameter type."
      );
    }

    if (isNaN(ms) || ms <= 0) {
      throw new LocationError(
        "INVALID_LOCATION",
        `Invalid timestamp value '${timestamp}'. Must be a valid ISO 8601 string or epoch milliseconds.`
      );
    }
    return ms;
  }

  /**
   * Full validation of a Location object
   */
  public static validateLocation(location: Location): void {
    if (!location) {
      throw new LocationError("INVALID_LOCATION", "Location object cannot be null or undefined.");
    }
    this.validateLatitude(location.latitude);
    this.validateLongitude(location.longitude);
    this.validateAccuracy(location.accuracy);
    this.validateSpeed(location.speed);
    this.normalizeHeading(location.heading);
    this.parseTimestampMs(location.timestamp);
  }

  /**
   * Evaluates location quality state against sampling options
   */
  public static evaluateQuality(
    location: Location,
    samplingOptions?: LocationSamplingOptions,
    nowMs: number = Date.now()
  ): LocationQualityState {
    try {
      this.validateLocation(location);
    } catch {
      return "INVALID";
    }

    const maxAgeMs = samplingOptions?.maxAgeMs ?? 60000;
    const maxAccuracyMeters = samplingOptions?.desiredAccuracyMeters ?? 100;
    const tsMs = this.parseTimestampMs(location.timestamp);

    if (nowMs - tsMs > maxAgeMs) {
      return "STALE";
    }

    if (location.accuracy !== undefined && location.accuracy !== null && location.accuracy > maxAccuracyMeters) {
      return "LOW_ACCURACY";
    }

    return "VALID";
  }
}
