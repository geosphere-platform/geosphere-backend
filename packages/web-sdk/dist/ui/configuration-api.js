"use strict";
/**
 * GeoSphere Runtime UI Configuration API Facade (GeoSphereUI)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereUI = void 0;
const theme_engine_js_1 = require("./theme-engine.js");
const branding_engine_js_1 = require("./branding-engine.js");
class GeoSphereUI {
    static themeEngine = new theme_engine_js_1.GeoSphereThemeEngine();
    static brandingEngine = new branding_engine_js_1.GeoSphereBrandingEngine();
    static activeDensity = "comfortable";
    static configure(params) {
        if (params.targetContainer !== undefined) {
            this.themeEngine.setTargetContainer(params.targetContainer);
        }
        if (params.mode) {
            this.themeEngine.setMode(params.mode);
        }
        if (params.visualStyle) {
            this.themeEngine.setVisualStyle(params.visualStyle);
        }
        if (params.density) {
            this.setDensity(params.density);
        }
        if (params.branding) {
            this.brandingEngine.updateBranding(params.branding);
        }
    }
    static setTheme(mode) {
        this.themeEngine.setMode(mode);
    }
    static setVisualStyle(preset) {
        this.themeEngine.setVisualStyle(preset);
    }
    static setDensity(density) {
        this.activeDensity = density;
        if (typeof document !== "undefined") {
            const container = document.documentElement;
            container.setAttribute("data-geosphere-density", density);
        }
    }
    static getDensity() {
        return this.activeDensity;
    }
    static setBranding(branding) {
        return this.brandingEngine.updateBranding(branding);
    }
    static getBranding() {
        return this.brandingEngine.getBranding();
    }
    static getTheme() {
        return this.themeEngine.getThemeContract();
    }
    static getThemeEngine() {
        return this.themeEngine;
    }
    static getBrandingEngine() {
        return this.brandingEngine;
    }
}
exports.GeoSphereUI = GeoSphereUI;
//# sourceMappingURL=configuration-api.js.map