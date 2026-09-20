"use strict";
/**
 * GeoSphere Shared UI Foundation Unit Test Suite
 */
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../ui/index.js");
const theme_contracts_js_1 = require("../contracts/theme.contracts.js");
async function runUIFoundationTests() {
    console.log("==========================================");
    console.log("RUNNING SHARED GEOSPHERE UI FOUNDATION TESTS");
    console.log("==========================================");
    // 1. Token Resolution & 3-Tier Hierarchy
    console.log("  [1/12] Testing 3-Tier Design Token Resolution...");
    const theme = index_js_1.GeoSphereUI.getTheme();
    const resolvedTokens = theme.tokens;
    if (!resolvedTokens || !resolvedTokens.colors || !resolvedTokens.colors.primary) {
        throw new Error("Design token resolution failed for primary color");
    }
    const componentTokens = (0, index_js_1.resolveComponentTokens)(theme_contracts_js_1.DEFAULT_DESIGN_TOKENS);
    if (componentTokens.button.primaryBg !== theme_contracts_js_1.DEFAULT_DESIGN_TOKENS.colors.primary) {
        throw new Error("Component token mapping failed for button primaryBg");
    }
    // 2. 10 Visual Style Presets Resolution
    console.log("  [2/12] Testing 10 Visual Style Presets...");
    const presets = Object.keys(index_js_1.VISUAL_STYLE_PRESETS);
    if (presets.length !== 10) {
        throw new Error(`Expected 10 visual style presets, found ${presets.length}`);
    }
    // Test modern preset
    index_js_1.GeoSphereUI.setVisualStyle("modern");
    let activeTheme = index_js_1.GeoSphereUI.getTheme();
    if (activeTheme.preset !== "modern") {
        throw new Error("Failed to set visual style preset to modern");
    }
    // Test glass preset
    index_js_1.GeoSphereUI.setVisualStyle("glass");
    activeTheme = index_js_1.GeoSphereUI.getTheme();
    if (activeTheme.preset !== "glass") {
        throw new Error("Failed to set visual style preset to glass");
    }
    // Reset to dark-pro
    index_js_1.GeoSphereUI.setVisualStyle("dark-pro");
    // 3. Mode Resolution (Light, Dark, System)
    console.log("  [3/12] Testing Theme Modes (Light, Dark, System)...");
    index_js_1.GeoSphereUI.setTheme("light");
    if (index_js_1.GeoSphereUI.getTheme().mode !== "light") {
        throw new Error("Failed to set mode to light");
    }
    index_js_1.GeoSphereUI.setTheme("dark");
    if (index_js_1.GeoSphereUI.getTheme().mode !== "dark") {
        throw new Error("Failed to set mode to dark");
    }
    // 4. Runtime Theme Switching & Subscribers
    console.log("  [4/12] Testing Runtime Theme Switching & Subscriber Notifications...");
    const themeEngine = new index_js_1.GeoSphereThemeEngine();
    let receivedThemeName = "";
    const unsubscribe = themeEngine.subscribe((theme) => {
        receivedThemeName = theme.name;
    });
    themeEngine.setVisualStyle("enterprise");
    if (!receivedThemeName.includes("enterprise")) {
        throw new Error("Subscriber failed to receive runtime visual style update");
    }
    unsubscribe();
    // 5. Theme Precedence Resolution
    console.log("  [5/12] Testing Deterministic Theme Precedence Hierarchy...");
    themeEngine.setHierarchy({
        environmentDefault: { tokens: { colors: { primary: "#000000" } } },
        tenantConfig: { tokens: { colors: { primary: "#111111" } } },
        userPreference: { tokens: { colors: { primary: "#7C3AED" } } }
    });
    const tokens = themeEngine.resolveTokens();
    if (tokens.colors.primary !== "#7C3AED") {
        throw new Error(`Theme precedence failed: expected #7C3AED, got ${tokens.colors.primary}`);
    }
    // 6. SDK Semantic Token Extension
    console.log("  [6/12] Testing SDK Semantic Token Extension...");
    const sdkSemantic = (0, index_js_1.resolveSDKSemanticTokens)(theme_contracts_js_1.DEFAULT_DESIGN_TOKENS.colors);
    if (!sdkSemantic.tracking || !sdkSemantic.tracking.trackingMovingColor) {
        throw new Error("SDK semantic tokens failed to resolve trackingMovingColor");
    }
    if (!sdkSemantic.geofence || !sdkSemantic.geofence.geofenceAlertColor) {
        throw new Error("SDK semantic tokens failed to resolve geofenceAlertColor");
    }
    // 7. Branding Engine & White-Label Updates
    console.log("  [7/12] Testing White-Label Branding Engine...");
    const brandingEngine = new index_js_1.GeoSphereBrandingEngine();
    const updated = brandingEngine.updateBranding({
        companyName: "Global Fleet Corp",
        applicationName: "Fleet Dispatcher",
        logoUrl: "https://globalfleet.test/logo.svg"
    });
    if (updated.companyName !== "Global Fleet Corp" || updated.applicationName !== "Fleet Dispatcher") {
        throw new Error("Branding update failed for companyName");
    }
    if (!brandingEngine.isModuleVisible("tracking")) {
        throw new Error("Module visibility check failed for tracking");
    }
    // 8. Density System (Compact, Comfortable, Spacious)
    console.log("  [8/12] Testing Density Scale Engine...");
    index_js_1.GeoSphereUI.setDensity("compact");
    if (index_js_1.GeoSphereUI.getDensity() !== "compact") {
        throw new Error("Failed to set density to compact");
    }
    index_js_1.GeoSphereUI.setDensity("comfortable");
    if (index_js_1.GeoSphereUI.getDensity() !== "comfortable") {
        throw new Error("Failed to set density to comfortable");
    }
    // 9. Centralized Icon System Strategy
    console.log("  [9/12] Testing Centralized Icon Strategy...");
    const checkIcon = index_js_1.GeoSphereIconRegistry.getIcon("check");
    if (!checkIcon || !checkIcon.svgPath) {
        throw new Error("Failed to retrieve common check icon");
    }
    index_js_1.GeoSphereIconRegistry.registerIcon("custom_star", {
        name: "custom_star",
        svgPath: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    });
    if (!index_js_1.GeoSphereIconRegistry.getIcon("custom_star")) {
        throw new Error("Failed to register custom icon");
    }
    // 10. Configure Facade API Integration
    console.log(" 10/12] Testing GeoSphereUI.configure() Facade...");
    index_js_1.GeoSphereUI.configure({
        mode: "dark",
        visualStyle: "modern",
        density: "spacious",
        branding: {
            companyName: "Configure Test Org",
            applicationName: "Config App"
        }
    });
    if (index_js_1.GeoSphereUI.getBranding().companyName !== "Configure Test Org") {
        throw new Error("GeoSphereUI.configure failed for branding companyName");
    }
    // 11. Security Audit Guard (Zero Secrets in UI Config)
    console.log("[11/12] Verifying UI Config Security Guard (Zero Secrets)...");
    const branding = index_js_1.GeoSphereUI.getBranding();
    const jsonStr = JSON.stringify(branding);
    if (jsonStr.includes("secret") || jsonStr.includes("password") || jsonStr.includes("token_")) {
        throw new Error("Security leak detected in UI branding state");
    }
    // 12. Backward Compatibility
    console.log("[12/12] Verifying Backward Compatibility...");
    if (!index_js_1.DEFAULT_BRANDING.applicationName) {
        throw new Error("Default branding missing applicationName");
    }
    console.log("✅ All Shared GeoSphere UI Foundation Tests Passed Successfully!");
}
runUIFoundationTests().catch((err) => {
    console.error("❌ Shared GeoSphere UI Foundation Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=ui-foundation.test.js.map