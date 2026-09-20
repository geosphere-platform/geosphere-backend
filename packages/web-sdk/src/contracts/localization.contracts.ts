/**
 * GeoSphere Localization Contracts
 */

export interface GeoSphereLocaleConfigContract {
  language: string;
  locale: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat?: string;
  distanceUnit: "kilometers" | "miles" | "nautical-miles" | "meters";
  speedUnit: "km/h" | "mph" | "knots";
  areaUnit?: "hectares" | "acres" | "sq_meters" | "sq_miles";
  currency?: string;
  isRtl?: boolean;
}

export function validateLocaleConfig(localeConfig: unknown): GeoSphereLocaleConfigContract {
  if (!localeConfig || typeof localeConfig !== "object") {
    throw new Error("[LOCALIZATION_ERROR] Locale configuration must be a valid non-null object.");
  }
  const l = localeConfig as Partial<GeoSphereLocaleConfigContract>;
  if (!l.language || !l.locale || !l.timezone) {
    throw new Error("[LOCALIZATION_ERROR] Locale configuration requires 'language', 'locale', and 'timezone'.");
  }
  return localeConfig as GeoSphereLocaleConfigContract;
}
