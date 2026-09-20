/**
 * GeoSphere Search, Geocoding & Places SDK Core Contracts
 * Framework-Neutral Search, Geocoding, Places & Autocomplete Engine
 * Consumes GeoSphere GIS SDK (Step 8) & Location SDK (Step 10)
 */

import { BoundingBoxTuple, GeoSphereCoordinate } from "./gis.contracts.js";
import { GeoSphereLocation, GeoSphereLocationSDK } from "./location.contracts.js";
import { GeoSphereRoute, GeoSphereRouteRequest, GeoSphereRoutingSDK } from "./routing.contracts.js";

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

export type GeoSphereSearchCapability =
  | "SEARCH"
  | "SUGGESTIONS"
  | "FORWARD_GEOCODING"
  | "REVERSE_GEOCODING"
  | "PLACE_DETAILS"
  | "NEARBY_SEARCH"
  | "CATEGORY_SEARCH"
  | "BOUNDS_SEARCH"
  | "COUNTRY_FILTER"
  | "LANGUAGE_SUPPORT"
  | "OPENING_HOURS"
  | "CONTACT_DETAILS";

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

export class GeoSphereSearchError extends Error {
  constructor(
    public readonly code:
      | "INVALID_QUERY"
      | "INVALID_COORDINATE"
      | "NO_RESULTS_FOUND"
      | "PROVIDER_UNAVAILABLE"
      | "PROVIDER_TIMEOUT"
      | "UNAUTHORIZED"
      | "RATE_LIMITED"
      | "UNSUPPORTED_CAPABILITY"
      | "MALFORMED_RESPONSE"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[SEARCH_ERROR:${code}] ${message}`);
    this.name = "GeoSphereSearchError";
  }
}

export interface GeoSphereSearchHistoryStore {
  save(place: GeoSpherePlace): Promise<void>;
  getRecent(limit?: number): Promise<GeoSpherePlace[]>;
  remove(placeId: string): Promise<void>;
  clear(): Promise<void>;
}

export class InMemorySearchHistoryStore implements GeoSphereSearchHistoryStore {
  private history: GeoSpherePlace[] = [];

  public async save(place: GeoSpherePlace): Promise<void> {
    this.history = [place, ...this.history.filter((p) => p.id !== place.id)];
  }

  public async getRecent(limit: number = 10): Promise<GeoSpherePlace[]> {
    return this.history.slice(0, limit);
  }

  public async remove(placeId: string): Promise<void> {
    this.history = this.history.filter((p) => p.id !== placeId);
  }

  public async clear(): Promise<void> {
    this.history = [];
  }
}

export class GeoSphereMockSearchProvider implements IGeoSphereSearchProvider {
  public getProviderInfo(): GeoSphereSearchProviderInfo {
    return { name: "GeoSphereMockSearchProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereSearchCapability[] {
    return [
      "SEARCH",
      "SUGGESTIONS",
      "FORWARD_GEOCODING",
      "REVERSE_GEOCODING",
      "PLACE_DETAILS",
      "NEARBY_SEARCH",
      "CATEGORY_SEARCH",
      "BOUNDS_SEARCH",
      "COUNTRY_FILTER",
      "LANGUAGE_SUPPORT",
      "OPENING_HOURS",
      "CONTACT_DETAILS"
    ];
  }

  public async search(request: GeoSphereSearchRequest): Promise<GeoSphereSearchResponse> {
    if (!request.query || request.query.trim().length === 0) {
      throw new GeoSphereSearchError("INVALID_QUERY", "Search query cannot be empty.");
    }

    const q = request.query.toLowerCase();
    const places: GeoSpherePlace[] = [
      {
        id: "place_nagpur_central",
        name: "Nagpur Central Station",
        coordinate: [79.0882, 21.1458],
        address: {
          formattedAddress: "Station Road, Nagpur, Maharashtra 440001, India",
          city: "Nagpur",
          state: "Maharashtra",
          country: "India",
          postalCode: "440001"
        },
        category: "transit",
        phone: "+91 712 2567890",
        website: "https://indianrailways.gov.in"
      },
      {
        id: "place_nagpur_airport",
        name: "Dr. Babasaheb Ambedkar International Airport",
        coordinate: [79.0472, 21.0922],
        address: {
          formattedAddress: "Sonegaon, Nagpur, Maharashtra 440005, India",
          city: "Nagpur",
          state: "Maharashtra",
          country: "India",
          postalCode: "440005"
        },
        category: "airport",
        phone: "+91 712 2807501"
      }
    ];

    const filtered = places.filter((p) => p.name.toLowerCase().includes(q) || p.address.formattedAddress.toLowerCase().includes(q));

    return {
      results: filtered.length > 0 ? filtered : places,
      totalCount: filtered.length > 0 ? filtered.length : places.length,
      providerName: this.getProviderInfo().name,
      evaluatedAt: new Date().toISOString()
    };
  }

  public async suggest(request: GeoSphereSearchRequest): Promise<GeoSphereSearchSuggestion[]> {
    const q = (request.query || "").toLowerCase();
    return [
      { id: "sug_1", title: `Nagpur City Center (${q})`, subtitle: "Maharashtra, India", placeId: "place_nagpur_central" },
      { id: "sug_2", title: "Nagpur International Airport", subtitle: "Sonegaon, Nagpur", placeId: "place_nagpur_airport" }
    ];
  }

  public async geocode(request: GeoSphereGeocodeRequest): Promise<GeoSphereSearchResponse> {
    if (!request.address || request.address.trim().length === 0) {
      throw new GeoSphereSearchError("INVALID_QUERY", "Geocode address cannot be empty.");
    }
    return this.search({ query: request.address });
  }

  public async reverseGeocode(request: GeoSphereReverseGeocodeRequest): Promise<GeoSphereAddress> {
    if (!request.coordinate || request.coordinate.length < 2) {
      throw new GeoSphereSearchError("INVALID_COORDINATE", "Invalid coordinate array provided for reverse geocoding.");
    }
    return {
      formattedAddress: `Plot 42, Civil Lines, Nagpur, Maharashtra 440001, India (Lat: ${request.coordinate[1]}, Lng: ${request.coordinate[0]})`,
      houseNumber: "42",
      street: "Civil Lines Main Rd",
      city: "Nagpur",
      state: "Maharashtra",
      country: "India",
      postalCode: "440001"
    };
  }

  public async getPlaceDetails(request: GeoSpherePlaceDetailsRequest): Promise<GeoSpherePlace> {
    if (!request.placeId) {
      throw new GeoSphereSearchError("INVALID_QUERY", "Place ID is required for details query.");
    }
    return {
      id: request.placeId,
      name: "Nagpur Central Station",
      coordinate: [79.0882, 21.1458],
      address: {
        formattedAddress: "Station Road, Nagpur, Maharashtra 440001, India",
        city: "Nagpur",
        state: "Maharashtra",
        country: "India",
        postalCode: "440001"
      },
      category: "transit",
      phone: "+91 712 2567890",
      openingHours: "Open 24/7"
    };
  }

  public async nearbySearch(request: GeoSphereNearbySearchRequest): Promise<GeoSphereSearchResponse> {
    if (!request.center || request.center.length < 2) {
      throw new GeoSphereSearchError("INVALID_COORDINATE", "Nearby search requires a valid center coordinate.");
    }
    return this.search({ query: request.keyword || request.category || "nearby", center: request.center, radiusMeters: request.radiusMeters });
  }
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

export class GeoSphereSearchSDK {
  private provider: IGeoSphereSearchProvider;
  private historyStore: GeoSphereSearchHistoryStore;
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();
  private locationSdk: GeoSphereLocationSDK | null = null;
  private routingSdk: GeoSphereRoutingSDK | null = null;

  constructor(
    private config: GeoSphereSearchConfig = {},
    provider?: IGeoSphereSearchProvider,
    historyStore?: GeoSphereSearchHistoryStore
  ) {
    this.provider = provider || new GeoSphereMockSearchProvider();
    this.historyStore = historyStore || new InMemorySearchHistoryStore();
    this.config.defaultLimit = this.config.defaultLimit ?? 10;
    this.config.timeoutMs = this.config.timeoutMs ?? 5000;
    this.config.debounceMs = this.config.debounceMs ?? 300;
    this.config.defaultRadiusMeters = this.config.defaultRadiusMeters ?? 5000;
  }

  public async initialize(locationSdk?: GeoSphereLocationSDK, routingSdk?: GeoSphereRoutingSDK): Promise<void> {
    if (locationSdk) this.locationSdk = locationSdk;
    if (routingSdk) this.routingSdk = routingSdk;
  }

  public getProviderInfo(): GeoSphereSearchProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereSearchCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereSearchCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async search(request: GeoSphereSearchRequest): Promise<GeoSphereSearchResponse> {
    try {
      const response = await this.provider.search(request);
      this.notifyListeners("search.executed", { request, response });
      return response;
    } catch (err: any) {
      this.notifyListeners("search.failed", { request, error: err });
      throw err;
    }
  }

  public async suggest(request: GeoSphereSearchRequest): Promise<GeoSphereSearchSuggestion[]> {
    return this.provider.suggest(request);
  }

  public async geocode(request: GeoSphereGeocodeRequest): Promise<GeoSphereSearchResponse> {
    try {
      const response = await this.provider.geocode(request);
      this.notifyListeners("search.geocoded", { request, response });
      return response;
    } catch (err: any) {
      this.notifyListeners("search.failed", { request, error: err });
      throw err;
    }
  }

  public async reverseGeocode(request: GeoSphereReverseGeocodeRequest): Promise<GeoSphereAddress> {
    return this.provider.reverseGeocode(request);
  }

  public async getPlaceDetails(request: GeoSpherePlaceDetailsRequest): Promise<GeoSpherePlace> {
    const place = await this.provider.getPlaceDetails(request);
    await this.historyStore.save(place);
    this.notifyListeners("search.placeSelected", { place });
    return place;
  }

  public async nearbySearch(request: GeoSphereNearbySearchRequest): Promise<GeoSphereSearchResponse> {
    return this.provider.nearbySearch(request);
  }

  public async nearbySearchFromCurrentLocation(category?: string, radiusMeters?: number): Promise<GeoSphereSearchResponse> {
    if (!this.locationSdk) {
      throw new GeoSphereSearchError("INVALID_QUERY", "Location SDK instance is not attached for nearby search from current position.");
    }
    const currentLoc: GeoSphereLocation = await this.locationSdk.getCurrentLocation();
    return this.nearbySearch({
      center: [currentLoc.longitude, currentLoc.latitude],
      radiusMeters: radiusMeters || this.config.defaultRadiusMeters || 5000,
      category
    });
  }

  public async getSearchHistory(limit?: number): Promise<GeoSpherePlace[]> {
    return this.historyStore.getRecent(limit);
  }

  public async clearSearchHistory(): Promise<void> {
    return this.historyStore.clear();
  }

  public async routeToPlace(destinationPlace: GeoSpherePlace, originCoordinate?: GeoSphereCoordinate): Promise<GeoSphereRoute> {
    if (!this.routingSdk) {
      throw new GeoSphereSearchError("INVALID_QUERY", "Routing SDK is not attached for routeToPlace workflow.");
    }
    const origin = originCoordinate || [79.0882, 21.1458];
    const req: GeoSphereRouteRequest = {
      origin,
      destination: destinationPlace.coordinate,
      options: { profile: "driving" }
    };
    const res = await this.routingSdk.calculateRoute(req);
    return res.primaryRoute;
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `srch_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[SEARCH_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
