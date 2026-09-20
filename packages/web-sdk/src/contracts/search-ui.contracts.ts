/**
 * GeoSphere Search SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const SEARCH_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  SEARCH_BAR: {
    id: "search.search-bar",
    name: "Search Bar & Input",
    version: "1.0.0",
    moduleId: "search",
    description: "Interactive search input bar with debounce, clear button, and suggestions popover trigger",
    inputs: [
      { name: "placeholder", type: "string", required: false, description: "Input placeholder text" },
      { name: "value", type: "string", required: false, description: "Current search text query" }
    ],
    outputs: ["onSearch", "onQueryChange", "onClear"],
    events: ["search.executed"],
    requiredPermissions: ["search.execute"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "SearchBar", framework: "react" },
      { platform: "android", componentSymbol: "SearchBar", framework: "compose" },
      { platform: "ios", componentSymbol: "SearchBar", framework: "swiftui" }
    ]
  },
  SEARCH_SUGGESTIONS: {
    id: "search.suggestions-list",
    name: "Search Suggestions List",
    version: "1.0.0",
    moduleId: "search",
    description: "Dropdown list component rendering real-time autocomplete suggestions with place categories and subtitles",
    inputs: [
      { name: "suggestions", type: "GeoSphereSearchSuggestion[]", required: true, description: "List of autocomplete suggestions" }
    ],
    outputs: ["onSuggestionSelect"],
    events: ["search.suggestionSelected"],
    requiredPermissions: ["search.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "SearchSuggestions", framework: "react" },
      { platform: "android", componentSymbol: "SearchSuggestions", framework: "compose" },
      { platform: "ios", componentSymbol: "SearchSuggestions", framework: "swiftui" }
    ]
  },
  PLACE_DETAILS: {
    id: "search.place-details-card",
    name: "Place Details Card",
    version: "1.0.0",
    moduleId: "search",
    description: "Comprehensive place details panel displaying POI name, address, category, phone, website, and action buttons",
    inputs: [
      { name: "place", type: "GeoSpherePlace", required: true, description: "Inspected place details model" }
    ],
    outputs: ["onRouteToPlace", "onNavigateToPlace", "onClose"],
    events: ["search.placeSelected"],
    requiredPermissions: ["search.placeDetails"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "PlaceDetails", framework: "react" },
      { platform: "android", componentSymbol: "PlaceDetails", framework: "compose" },
      { platform: "ios", componentSymbol: "PlaceDetails", framework: "swiftui" }
    ]
  }
};

export const SEARCH_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  SEARCH_SCREEN: {
    id: "search.main-screen",
    title: "Search & Discovery Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Full search and discovery screen combining search bar, autocomplete suggestions, map markers, and place cards",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["SEARCH", "SUGGESTIONS", "PLACE_DETAILS"],
    requiredPermissions: ["search.execute"],
    containedComponents: ["search.search-bar", "search.suggestions-list", "search.place-details-card"],
    adapters: [
      { platform: "web", componentSymbol: "SearchScreen", framework: "react" },
      { platform: "android", componentSymbol: "SearchScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "SearchScreen", framework: "swiftui" }
    ]
  },
  SEARCH_RESULTS_SCREEN: {
    id: "search.results-screen",
    title: "Search Results List & Map Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Results view rendering list of places with distance badges and map markers",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["SEARCH"],
    requiredPermissions: ["search.read"],
    containedComponents: ["search.search-bar", "search.place-details-card"],
    adapters: [
      { platform: "web", componentSymbol: "SearchResultsScreen", framework: "react" },
      { platform: "android", componentSymbol: "SearchResultsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "SearchResultsScreen", framework: "swiftui" }
    ]
  },
  PLACE_DETAILS_SCREEN: {
    id: "search.place-details-screen",
    title: "Full Place Inspector Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Dedicated place details view showing POI contacts, website, opening hours, and Route/Navigate action buttons",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["PLACE_DETAILS"],
    requiredPermissions: ["search.placeDetails"],
    containedComponents: ["search.place-details-card"],
    adapters: [
      { platform: "web", componentSymbol: "PlaceDetailsScreen", framework: "react" },
      { platform: "android", componentSymbol: "PlaceDetailsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "PlaceDetailsScreen", framework: "swiftui" }
    ]
  },
  NEARBY_PLACES_SCREEN: {
    id: "search.nearby-screen",
    title: "Nearby Places Discovery Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Nearby POI discovery screen searching around device position or specified spatial center",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["NEARBY_SEARCH"],
    requiredPermissions: ["search.execute"],
    containedComponents: ["search.place-details-card"],
    adapters: [
      { platform: "web", componentSymbol: "NearbyPlacesScreen", framework: "react" },
      { platform: "android", componentSymbol: "NearbyPlacesScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "NearbyPlacesScreen", framework: "swiftui" }
    ]
  },
  ADDRESS_SELECTION_SCREEN: {
    id: "search.address-selection-screen",
    title: "Address Selector & Picker Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Address selection modal/screen for picking origin/destination addresses or pin drop location",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["FORWARD_GEOCODING", "REVERSE_GEOCODING"],
    requiredPermissions: ["search.read"],
    containedComponents: ["search.search-bar"],
    adapters: [
      { platform: "web", componentSymbol: "AddressSelectionScreen", framework: "react" },
      { platform: "android", componentSymbol: "AddressSelectionScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "AddressSelectionScreen", framework: "swiftui" }
    ]
  },
  SEARCH_SETTINGS_SCREEN: {
    id: "search.settings-screen",
    title: "Search & Provider Configuration Screen",
    version: "1.0.0",
    moduleId: "search",
    description: "Search configuration screen for setting provider, language, country, and radius defaults",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["SEARCH"],
    requiredPermissions: ["search.configure"],
    containedComponents: ["search.search-bar"],
    adapters: [
      { platform: "web", componentSymbol: "SearchSettingsScreen", framework: "react" },
      { platform: "android", componentSymbol: "SearchSettingsScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "SearchSettingsScreen", framework: "swiftui" }
    ]
  }
};
