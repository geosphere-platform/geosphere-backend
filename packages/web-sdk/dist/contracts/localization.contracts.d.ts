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
export declare function validateLocaleConfig(localeConfig: unknown): GeoSphereLocaleConfigContract;
//# sourceMappingURL=localization.contracts.d.ts.map