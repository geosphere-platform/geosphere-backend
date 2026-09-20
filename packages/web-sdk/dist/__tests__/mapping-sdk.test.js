/**
 * GeoSphere Step 9 Mapping SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereMapping, MAPPING_UI_COMPONENTS, MAPPING_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runMappingSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE MAPPING SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Mapping Provider & Capability Setup
    console.log("  [1/18] Testing Map Provider & Capability Resolution...");
    const mockProvider = {
        id: "provider_openlayers",
        name: "OpenLayers Vector Tile Engine",
        type: "openlayers",
        capabilities: ["TILE_MAP", "VECTOR_TILES", "SATELLITE", "ROTATION", "STYLING"],
        attribution: "© OpenStreetMap contributors, © GeoSphere Platform"
    };
    const defaultBasemap = {
        id: "osm_streets",
        name: "OpenStreetMap Streets",
        category: "streets",
        providerType: "openlayers",
        tileUrlPattern: "https://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "© OpenStreetMap contributors"
    };
    const defaultStyle = {
        id: "style_modern_light",
        name: "Modern Light Preset",
        category: "light"
    };
    const mappingConfig = {
        gisConfig: {
            initialViewport: { center: [-122.4194, 37.7749], zoom: 12 }
        },
        provider: mockProvider,
        defaultBasemap,
        defaultStyle,
        controls: [
            { id: "ctrl_zoom", type: "zoom", position: "top-right", enabled: true },
            { id: "ctrl_basemap", type: "basemap", position: "top-left", enabled: true }
        ],
        embeddedMode: true
    };
    const mappingSdk = new GeoSphereMapping(mappingConfig);
    await mappingSdk.initialize();
    if (mappingSdk.getProvider().id !== "provider_openlayers") {
        throw new Error("Provider initialization failed");
    }
    // 2. Capability Queries
    console.log("  [2/18] Testing Provider Capability Queries...");
    if (!mappingSdk.hasCapability("VECTOR_TILES") || !mappingSdk.hasCapability("SATELLITE")) {
        throw new Error("Capability query failed for supported capability");
    }
    if (mappingSdk.hasCapability("THREE_D")) {
        throw new Error("Capability query returned true for unsupported capability THREE_D");
    }
    // 3. Basemap Selection & Management
    console.log("  [3/18] Testing Basemap Selection & Switching...");
    const satelliteBasemap = {
        id: "satellite_world",
        name: "Satellite Imagery",
        category: "satellite",
        providerType: "openlayers",
        attribution: "© Earthstar Geographics"
    };
    mappingSdk.addBasemap(satelliteBasemap);
    if (mappingSdk.getBasemaps().length !== 2) {
        throw new Error("addBasemap() failed to register new basemap");
    }
    mappingSdk.setBasemap("satellite_world");
    if (mappingSdk.getActiveBasemap().id !== "satellite_world") {
        throw new Error("setBasemap() failed to switch active basemap");
    }
    // 4. Map Style Selection & Management
    console.log("  [4/18] Testing Map Style Selection & Switching...");
    const darkStyle = {
        id: "style_dark_pro",
        name: "Dark Pro Preset",
        category: "dark"
    };
    mappingSdk.addMapStyle(darkStyle);
    mappingSdk.setMapStyle("style_dark_pro");
    if (mappingSdk.getActiveMapStyle()?.id !== "style_dark_pro") {
        throw new Error("setMapStyle() failed to switch active style");
    }
    // 5. Control Toggle & Management
    console.log("  [5/18] Testing Map Controls Toggle & Management...");
    if (mappingSdk.getControls().length !== 2) {
        throw new Error("Controls initialization failed");
    }
    mappingSdk.toggleControl("ctrl_zoom", false);
    const zoomControl = mappingSdk.getControls().find((c) => c.id === "ctrl_zoom");
    if (zoomControl?.enabled !== false) {
        throw new Error("toggleControl() failed to disable zoom control");
    }
    // 6. Viewport Delegation to Underlying GIS Engine (Zero Duplicated GIS Engine)
    console.log("  [6/18] Testing Viewport Delegation to Underlying GIS Engine...");
    mappingSdk.setViewport({ center: [2.3522, 48.8566], zoom: 14 }); // Paris
    const currentViewport = mappingSdk.getViewport();
    if (currentViewport.center[0] !== 2.3522 || currentViewport.zoom !== 14) {
        throw new Error("Viewport delegation to GIS engine failed");
    }
    // 7. Layer Presentation Delegation
    console.log("  [7/18] Testing Layer Presentation Delegation...");
    mappingSdk.addLayer({
        id: "layer_traffic",
        name: "Live Traffic Layer",
        type: "overlay",
        visible: true,
        zIndex: 4
    });
    const gisLayers = mappingSdk.getGIS().getLayers();
    if (gisLayers.length !== 1 || gisLayers[0].id !== "layer_traffic") {
        throw new Error("addLayer() delegation to GIS engine failed");
    }
    // 8. Feature Presentation Delegation
    console.log("  [8/18] Testing Feature Presentation Delegation...");
    mappingSdk.addFeature({
        id: "feat_paris_hub",
        layerId: "layer_traffic",
        geometry: { type: "Point", coordinates: [2.3522, 48.8566] },
        properties: { name: "Paris Central Logistics Hub" }
    });
    const gisFeatures = mappingSdk.getGIS().getFeatures("layer_traffic");
    if (gisFeatures.length !== 1 || gisFeatures[0].id !== "feat_paris_hub") {
        throw new Error("addFeature() delegation to GIS engine failed");
    }
    // 9. Provider Attribution String Display
    console.log("  [9/18] Testing Provider Attribution String Generation...");
    const attributionStr = mappingSdk.getAttribution();
    if (!attributionStr.includes("OpenStreetMap") && !attributionStr.includes("Earthstar")) {
        throw new Error("getAttribution() failed to aggregate provider & basemap attributions");
    }
    // 10. Theme System Integration
    console.log(" [10/18] Testing Mapping Theme System Integration...");
    const mappingTheme = resolveThemePrecedence({
        tenantConfig: {
            preset: "glass",
            tokens: { colors: { primary: "#6366F1", surface: "rgba(255,255,255,0.1)" } }
        }
    });
    if (mappingTheme.colors.primary !== "#6366F1") {
        throw new Error("Theme precedence resolution failed for Mapping SDK");
    }
    // 11. Localization Configuration
    console.log(" [11/18] Testing Mapping Localization Configuration...");
    const validLocale = validateLocaleConfig({
        language: "fr",
        locale: "fr-FR",
        timezone: "Europe/Paris",
        dateFormat: "DD/MM/YYYY",
        timeFormat: "HH:mm",
        distanceUnit: "kilometers",
        speedUnit: "km/h"
    });
    if (validLocale.locale !== "fr-FR" || validLocale.distanceUnit !== "kilometers") {
        throw new Error("Mapping localization config validation failed");
    }
    // 12. RBAC Permission Integration
    console.log(" [12/18] Testing Mapping RBAC Permission Checks...");
    const userPerms = ["map.read", "basemap.read", "basemap.change"];
    const basemapUIState = evaluatePermissionState(userPerms, "basemap.change", "hide");
    if (basemapUIState.status !== "granted") {
        throw new Error("RBAC evaluation failed for granted basemap.change permission");
    }
    const styleUIState = evaluatePermissionState(userPerms, "mapStyle.change", "disable");
    if (styleUIState.status !== "denied" || styleUIState.mode !== "disable") {
        throw new Error("RBAC evaluation failed for denied mapStyle.change permission");
    }
    // 13. Reusable UI Components Metadata
    console.log(" [13/18] Testing Reusable Mapping Component Definitions Metadata...");
    const geosphereMapComp = MAPPING_UI_COMPONENTS.GEOSPHERE_MAP;
    const basemapSelComp = MAPPING_UI_COMPONENTS.BASEMAP_SELECTOR;
    if (geosphereMapComp.id !== "mapping.map-canvas" || geosphereMapComp.supportedPlatforms.length !== 3) {
        throw new Error("GEOSPHERE_MAP component metadata check failed");
    }
    if (!basemapSelComp.requiredPermissions.includes("basemap.read")) {
        throw new Error("BASEMAP_SELECTOR required permissions check failed");
    }
    // 14. Ready-Made Mapping Screens Metadata
    console.log(" [14/18] Testing Ready-Made Mapping Screen Definitions Metadata...");
    const mapViewerScreen = MAPPING_READY_MADE_SCREENS.MAP_VIEWER_SCREEN;
    const basemapScreen = MAPPING_READY_MADE_SCREENS.BASEMAP_SELECTOR_SCREEN;
    if (mapViewerScreen.mode !== "full-screen" || !mapViewerScreen.requiredCapabilities.includes("TILE_MAP")) {
        throw new Error("MAP_VIEWER_SCREEN metadata check failed");
    }
    if (!basemapScreen.requiredPermissions.includes("basemap.change")) {
        throw new Error("BASEMAP_SELECTOR_SCREEN required permissions check failed");
    }
    // 15. Map Engine Leakage Protection Audit
    console.log(" [15/18] Verifying Map Engine Non-Leakage Protection Guard...");
    const mappingSdkStr = JSON.stringify(mappingSdk);
    if (mappingSdkStr.includes("mapbox-gl") || mappingSdkStr.includes("maplibre-gl") || mappingSdkStr.includes("google.maps")) {
        throw new Error("SECURITY/DEPENDENCY VIOLATION: Provider-specific engine leaked into Mapping Core!");
    }
    // 16. Resource Cleanup
    console.log(" [16/18] Testing Mapping SDK Resource Cleanup (destroy)...");
    mappingSdk.destroy();
    if (mappingSdk.getBasemaps().length !== 0 || mappingSdk.getGIS().getFeatures().length !== 0) {
        throw new Error("destroy() failed to clear Mapping & GIS resources");
    }
    // 17. Backward Compatibility with Existing MapsModule & GeoSphereClient.maps
    console.log(" [17/18] Verifying Backward Compatibility with GeoSphereClient.maps...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_map_test_001",
        applicationId: "app_map_test_001"
    });
    if (!client.maps || typeof client.maps.createMapping !== "function" || typeof client.maps.listMaps !== "function") {
        throw new Error("Backward compatibility broken: existing client.maps facade is invalid");
    }
    console.log("✅ All GeoSphere Mapping SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runMappingSdkTests().catch((err) => {
    console.error("❌ GeoSphere Mapping SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=mapping-sdk.test.js.map