"use strict";
/**
 * GeoSphere Runtime White-Label Branding Engine
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereBrandingEngine = exports.DEFAULT_BRANDING = void 0;
const index_js_1 = require("../contracts/index.js");
exports.DEFAULT_BRANDING = {
    applicationName: "GeoSphere Enterprise Platform",
    companyName: "GeoSphere Platform",
    logoUrl: undefined,
    iconUrl: undefined,
    faviconUrl: undefined,
    brandColors: {
        primary: "#2563EB",
        accent: "#10B981"
    },
    moduleVisibility: {
        gis: true,
        mapping: true,
        location: true,
        tracking: true,
        routing: true,
        geofence: true,
        fieldForce: true,
        offline: true,
        reporting: true
    }
};
class GeoSphereBrandingEngine {
    activeBranding;
    listeners = new Set();
    constructor(initialBranding) {
        this.activeBranding = {
            ...exports.DEFAULT_BRANDING,
            ...initialBranding
        };
    }
    getBranding() {
        return { ...this.activeBranding };
    }
    updateBranding(update) {
        const nextBranding = {
            ...this.activeBranding,
            ...update,
            brandColors: {
                ...this.activeBranding.brandColors,
                ...update.brandColors
            },
            moduleVisibility: {
                ...this.activeBranding.moduleVisibility,
                ...update.moduleVisibility
            }
        };
        this.activeBranding = (0, index_js_1.validateBrandingConfig)(nextBranding);
        this.notifyListeners();
        return this.getBranding();
    }
    isModuleVisible(moduleId) {
        if (!this.activeBranding.moduleVisibility)
            return true;
        return this.activeBranding.moduleVisibility[moduleId] !== false;
    }
    subscribe(listener) {
        this.listeners.add(listener);
        listener(this.getBranding());
        return () => {
            this.listeners.delete(listener);
        };
    }
    notifyListeners() {
        const current = this.getBranding();
        this.listeners.forEach((listener) => {
            try {
                listener(current);
            }
            catch (err) {
                console.error("[BRANDING_ENGINE_ERROR] Listener notification failed:", err);
            }
        });
    }
}
exports.GeoSphereBrandingEngine = GeoSphereBrandingEngine;
//# sourceMappingURL=branding-engine.js.map