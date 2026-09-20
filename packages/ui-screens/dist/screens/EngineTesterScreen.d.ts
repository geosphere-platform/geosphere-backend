import React from "react";
export interface EngineTesterScreenProps {
    initialEngine?: "MAPPING" | "TELEMETRY" | "GEOFENCE" | "ROUTING" | "OFFLINE_SYNC";
}
export declare const smoothPolygonCoords: (coords: Array<[number, number]>, iterations?: number) => Array<[number, number]>;
export interface DistrictGeofenceData {
    id: string;
    name: string;
    isEntireState?: boolean;
    center: [number, number];
    zoom: number;
    areaSqKm: number;
    perimeterKm: number;
    polygonCoords: Array<[number, number]>;
}
export interface StateGeofenceData {
    stateName: string;
    stateCode: string;
    capitalName: string;
    colorHex: string;
    entireStateBoundary: DistrictGeofenceData;
    districts: DistrictGeofenceData[];
}
export interface CountryGeofenceData {
    countryName: string;
    countryCode: string;
    flagEmoji: string;
    capitalName: string;
    center: [number, number];
    zoom: number;
    states: StateGeofenceData[];
}
export declare const GLOBAL_COUNTRIES_DATASET: CountryGeofenceData[];
export declare const INDIAN_STATES_DISTRICTS_DATASET: StateGeofenceData[];
export declare const EngineTesterScreen: React.FC<EngineTesterScreenProps>;
//# sourceMappingURL=EngineTesterScreen.d.ts.map