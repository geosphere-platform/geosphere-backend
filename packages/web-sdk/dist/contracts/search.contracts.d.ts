/**
 * GeoSphere Search, Geocoding & Places SDK Core Contracts
 * Framework-Neutral Search, Geocoding, Places & Autocomplete Engine
 * Consumes GeoSphere GIS SDK (Step 8) & Location SDK (Step 10)
 */
import { BoundingBoxTuple, GeoSphereCoordinate } from "./gis.contracts.js";
import { GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereRoute, GeoSphereRoutingSDK } from "./routing.contracts.js";
export interface GeoSphereAddress {
    formattedAddress: string;
    houseNumber?: string;
    street?: string;
    locality?: string;
    city?: string;
    district?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
}
export interface GeoSpherePlace {
    id: string;
    name: string;
    address: GeoSphereAddress;
    coordinate: GeoSphereCoordinate;
    category?: string;
    categories?: string[];
    phone?: string;
    website?: string;
    openingHours?: string;
    viewport?: BoundingBoxTuple;
    confidence?: number;
    metadata?: Record<string, unknown>;
}
export interface GeoSphereSearchSuggestion {
    id: string;
    title: string;
    subtitle?: string;
    coordinate?: GeoSphereCoordinate;
    category?: string;
    placeId?: string;
}
export interface GeoSphereSearchRequest {
    query: string;
    center?: GeoSphereCoordinate;
    radiusMeters?: number;
    bounds?: BoundingBoxTuple;
    country?: string;
    language?: string;
    category?: string;
    limit?: number;
    filters?: Record<string, unknown>;
}
export interface GeoSphereGeocodeRequest {
    address: string;
    country?: string;
    bounds?: BoundingBoxTuple;
    limit?: number;
}
export interface GeoSphereReverseGeocodeRequest {
    coordinate: GeoSphereCoordinate;
    language?: string;
}
export interface GeoSphereNearbySearchRequest {
    center: GeoSphereCoordinate;
    radiusMeters: number;
    category?: string;
    keyword?: string;
    limit?: number;
    filters?: Record<string, unknown>;
}
export interface GeoSpherePlaceDetailsRequest {
    placeId: string;
    language?: string;
}
export interface GeoSphereSearchResponse {
    results: GeoSpherePlace[];
    totalCount: number;
    providerName: string;
    evaluatedAt: string;
}
export type GeoSphereSearchCapability = "SEARCH" | "SUGGESTIONS" | "FORWARD_GEOCODING" | "REVERSE_GEOCODING" | "PLACE_DETAILS" | "NEARBY_SEARCH" | "CATEGORY_SEARCH" | "BOUNDS_SEARCH" | "COUNTRY_FILTER" | "LANGUAGE_SUPPORT" | "OPENING_HOURS" | "CONTACT_DETAILS";
export interface GeoSphereSearchProviderInfo {
    name: string;
    version: string;
}
export interface IGeoSphereSearchProvider {
    getProviderInfo(): GeoSphereSearchProviderInfo;
    getCapabilities(): GeoSphereSearchCapability[];
    search(request: GeoSphereSearchRequest): Promise<GeoSphereSearchResponse>;
    suggest(request: GeoSphereSearchRequest): Promise<GeoSphereSearchSuggestion[]>;
    geocode(request: GeoSphereGeocodeRequest): Promise<GeoSphereSearchResponse>;
    reverseGeocode(request: GeoSphereReverseGeocodeRequest): Promise<GeoSphereAddress>;
    getPlaceDetails(request: GeoSpherePlaceDetailsRequest): Promise<GeoSpherePlace>;
    nearbySearch(request: GeoSphereNearbySearchRequest): Promise<GeoSphereSearchResponse>;
}
export declare class GeoSphereSearchError extends Error {
    readonly code: "INVALID_QUERY" | "INVALID_COORDINATE" | "NO_RESULTS_FOUND" | "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT" | "UNAUTHORIZED" | "RATE_LIMITED" | "UNSUPPORTED_CAPABILITY" | "MALFORMED_RESPONSE" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "INVALID_QUERY" | "INVALID_COORDINATE" | "NO_RESULTS_FOUND" | "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT" | "UNAUTHORIZED" | "RATE_LIMITED" | "UNSUPPORTED_CAPABILITY" | "MALFORMED_RESPONSE" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export interface GeoSphereSearchHistoryStore {
    save(place: GeoSpherePlace): Promise<void>;
    getRecent(limit?: number): Promise<GeoSpherePlace[]>;
    remove(placeId: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class InMemorySearchHistoryStore implements GeoSphereSearchHistoryStore {
    private history;
    save(place: GeoSpherePlace): Promise<void>;
    getRecent(limit?: number): Promise<GeoSpherePlace[]>;
    remove(placeId: string): Promise<void>;
    clear(): Promise<void>;
}
export declare class GeoSphereMockSearchProvider implements IGeoSphereSearchProvider {
    getProviderInfo(): GeoSphereSearchProviderInfo;
    getCapabilities(): GeoSphereSearchCapability[];
    search(request: GeoSphereSearchRequest): Promise<GeoSphereSearchResponse>;
    suggest(request: GeoSphereSearchRequest): Promise<GeoSphereSearchSuggestion[]>;
    geocode(request: GeoSphereGeocodeRequest): Promise<GeoSphereSearchResponse>;
    reverseGeocode(request: GeoSphereReverseGeocodeRequest): Promise<GeoSphereAddress>;
    getPlaceDetails(request: GeoSpherePlaceDetailsRequest): Promise<GeoSpherePlace>;
    nearbySearch(request: GeoSphereNearbySearchRequest): Promise<GeoSphereSearchResponse>;
}
export interface GeoSphereSearchConfig {
    provider?: string;
    language?: string;
    country?: string;
    defaultLimit?: number;
    timeoutMs?: number;
    debounceMs?: number;
    defaultRadiusMeters?: number;
    units?: "metric" | "imperial";
    embeddedMode?: boolean;
}
export declare class GeoSphereSearchSDK {
    private config;
    private provider;
    private historyStore;
    private listeners;
    private locationSdk;
    private routingSdk;
    constructor(config?: GeoSphereSearchConfig, provider?: IGeoSphereSearchProvider, historyStore?: GeoSphereSearchHistoryStore);
    initialize(locationSdk?: GeoSphereLocationSDK, routingSdk?: GeoSphereRoutingSDK): Promise<void>;
    getProviderInfo(): GeoSphereSearchProviderInfo;
    getCapabilities(): GeoSphereSearchCapability[];
    hasCapability(capability: GeoSphereSearchCapability): boolean;
    search(request: GeoSphereSearchRequest): Promise<GeoSphereSearchResponse>;
    suggest(request: GeoSphereSearchRequest): Promise<GeoSphereSearchSuggestion[]>;
    geocode(request: GeoSphereGeocodeRequest): Promise<GeoSphereSearchResponse>;
    reverseGeocode(request: GeoSphereReverseGeocodeRequest): Promise<GeoSphereAddress>;
    getPlaceDetails(request: GeoSpherePlaceDetailsRequest): Promise<GeoSpherePlace>;
    nearbySearch(request: GeoSphereNearbySearchRequest): Promise<GeoSphereSearchResponse>;
    nearbySearchFromCurrentLocation(category?: string, radiusMeters?: number): Promise<GeoSphereSearchResponse>;
    getSearchHistory(limit?: number): Promise<GeoSpherePlace[]>;
    clearSearchHistory(): Promise<void>;
    routeToPlace(destinationPlace: GeoSpherePlace, originCoordinate?: GeoSphereCoordinate): Promise<GeoSphereRoute>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private notifyListeners;
}
//# sourceMappingURL=search.contracts.d.ts.map