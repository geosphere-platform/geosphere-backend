/**
 * GeoSphere Search, Geocoding & Places SDK Core Contracts
 * Framework-Neutral Search, Geocoding, Places & Autocomplete Engine
 * Consumes GeoSphere GIS SDK (Step 8) & Location SDK (Step 10)
 */
export class GeoSphereSearchError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[SEARCH_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereSearchError";
    }
}
export class InMemorySearchHistoryStore {
    history = [];
    async save(place) {
        this.history = [place, ...this.history.filter((p) => p.id !== place.id)];
    }
    async getRecent(limit = 10) {
        return this.history.slice(0, limit);
    }
    async remove(placeId) {
        this.history = this.history.filter((p) => p.id !== placeId);
    }
    async clear() {
        this.history = [];
    }
}
export class GeoSphereMockSearchProvider {
    getProviderInfo() {
        return { name: "GeoSphereMockSearchProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async search(request) {
        if (!request.query || request.query.trim().length === 0) {
            throw new GeoSphereSearchError("INVALID_QUERY", "Search query cannot be empty.");
        }
        const q = request.query.toLowerCase();
        const places = [
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
    async suggest(request) {
        const q = (request.query || "").toLowerCase();
        return [
            { id: "sug_1", title: `Nagpur City Center (${q})`, subtitle: "Maharashtra, India", placeId: "place_nagpur_central" },
            { id: "sug_2", title: "Nagpur International Airport", subtitle: "Sonegaon, Nagpur", placeId: "place_nagpur_airport" }
        ];
    }
    async geocode(request) {
        if (!request.address || request.address.trim().length === 0) {
            throw new GeoSphereSearchError("INVALID_QUERY", "Geocode address cannot be empty.");
        }
        return this.search({ query: request.address });
    }
    async reverseGeocode(request) {
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
    async getPlaceDetails(request) {
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
    async nearbySearch(request) {
        if (!request.center || request.center.length < 2) {
            throw new GeoSphereSearchError("INVALID_COORDINATE", "Nearby search requires a valid center coordinate.");
        }
        return this.search({ query: request.keyword || request.category || "nearby", center: request.center, radiusMeters: request.radiusMeters });
    }
}
export class GeoSphereSearchSDK {
    config;
    provider;
    historyStore;
    listeners = new Map();
    locationSdk = null;
    routingSdk = null;
    constructor(config = {}, provider, historyStore) {
        this.config = config;
        this.provider = provider || new GeoSphereMockSearchProvider();
        this.historyStore = historyStore || new InMemorySearchHistoryStore();
        this.config.defaultLimit = this.config.defaultLimit ?? 10;
        this.config.timeoutMs = this.config.timeoutMs ?? 5000;
        this.config.debounceMs = this.config.debounceMs ?? 300;
        this.config.defaultRadiusMeters = this.config.defaultRadiusMeters ?? 5000;
    }
    async initialize(locationSdk, routingSdk) {
        if (locationSdk)
            this.locationSdk = locationSdk;
        if (routingSdk)
            this.routingSdk = routingSdk;
    }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async search(request) {
        try {
            const response = await this.provider.search(request);
            this.notifyListeners("search.executed", { request, response });
            return response;
        }
        catch (err) {
            this.notifyListeners("search.failed", { request, error: err });
            throw err;
        }
    }
    async suggest(request) {
        return this.provider.suggest(request);
    }
    async geocode(request) {
        try {
            const response = await this.provider.geocode(request);
            this.notifyListeners("search.geocoded", { request, response });
            return response;
        }
        catch (err) {
            this.notifyListeners("search.failed", { request, error: err });
            throw err;
        }
    }
    async reverseGeocode(request) {
        return this.provider.reverseGeocode(request);
    }
    async getPlaceDetails(request) {
        const place = await this.provider.getPlaceDetails(request);
        await this.historyStore.save(place);
        this.notifyListeners("search.placeSelected", { place });
        return place;
    }
    async nearbySearch(request) {
        return this.provider.nearbySearch(request);
    }
    async nearbySearchFromCurrentLocation(category, radiusMeters) {
        if (!this.locationSdk) {
            throw new GeoSphereSearchError("INVALID_QUERY", "Location SDK instance is not attached for nearby search from current position.");
        }
        const currentLoc = await this.locationSdk.getCurrentLocation();
        return this.nearbySearch({
            center: [currentLoc.longitude, currentLoc.latitude],
            radiusMeters: radiusMeters || this.config.defaultRadiusMeters || 5000,
            category
        });
    }
    async getSearchHistory(limit) {
        return this.historyStore.getRecent(limit);
    }
    async clearSearchHistory() {
        return this.historyStore.clear();
    }
    async routeToPlace(destinationPlace, originCoordinate) {
        if (!this.routingSdk) {
            throw new GeoSphereSearchError("INVALID_QUERY", "Routing SDK is not attached for routeToPlace workflow.");
        }
        const origin = originCoordinate || [79.0882, 21.1458];
        const req = {
            origin,
            destination: destinationPlace.coordinate,
            options: { profile: "driving" }
        };
        const res = await this.routingSdk.calculateRoute(req);
        return res.primaryRoute;
    }
    subscribe(onEvent) {
        const subId = `srch_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[SEARCH_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=search.contracts.js.map