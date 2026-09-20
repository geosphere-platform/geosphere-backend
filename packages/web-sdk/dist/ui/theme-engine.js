"use strict";
/**
 * GeoSphere Theme Engine & CSS Custom Property Injector
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereThemeEngine = void 0;
const theme_contracts_js_1 = require("../contracts/theme.contracts.js");
const tokens_js_1 = require("./tokens.js");
class GeoSphereThemeEngine {
    activePreset = "classic";
    activeMode = "dark";
    hierarchy = {};
    listeners = new Set();
    targetContainer = null;
    constructor(initialHierarchy, targetElement) {
        if (initialHierarchy) {
            this.hierarchy = initialHierarchy;
        }
        if (targetElement) {
            this.targetContainer = targetElement;
        }
    }
    setTargetContainer(element) {
        this.targetContainer = element;
        this.injectCssVariables();
    }
    setMode(mode) {
        this.activeMode = mode;
        this.notifyAndInject();
    }
    getMode() {
        return this.activeMode;
    }
    setVisualStyle(preset) {
        this.activePreset = preset;
        const presetTokens = tokens_js_1.VISUAL_STYLE_PRESETS[preset];
        if (presetTokens) {
            this.hierarchy.applicationConfig = {
                preset,
                tokens: presetTokens
            };
        }
        this.notifyAndInject();
    }
    getVisualStyle() {
        return this.activePreset;
    }
    setHierarchy(hierarchy) {
        this.hierarchy = hierarchy;
        this.notifyAndInject();
    }
    getHierarchy() {
        return this.hierarchy;
    }
    resolveTokens() {
        const base = (0, theme_contracts_js_1.resolveThemePrecedence)(this.hierarchy);
        const finalTokens = JSON.parse(JSON.stringify(tokens_js_1.GLOBAL_TOKENS));
        // Apply visual style preset first (lower priority than tenant / user preference)
        const presetTokens = tokens_js_1.VISUAL_STYLE_PRESETS[this.activePreset];
        if (presetTokens) {
            if (presetTokens.colors)
                Object.assign(finalTokens.colors, presetTokens.colors);
            if (presetTokens.typography)
                Object.assign(finalTokens.typography, presetTokens.typography);
            if (presetTokens.spacing)
                Object.assign(finalTokens.spacing, presetTokens.spacing);
            if (presetTokens.shape)
                Object.assign(finalTokens.shape, presetTokens.shape);
            if (presetTokens.elevation)
                Object.assign(finalTokens.elevation, presetTokens.elevation);
            if (presetTokens.layout)
                Object.assign(finalTokens.layout, presetTokens.layout);
        }
        // Now apply resolved hierarchy overrides (higher priority levels like tenant, user preference)
        if (base.colors)
            Object.assign(finalTokens.colors, base.colors);
        if (base.typography)
            Object.assign(finalTokens.typography, base.typography);
        if (base.spacing)
            Object.assign(finalTokens.spacing, base.spacing);
        if (base.shape)
            Object.assign(finalTokens.shape, base.shape);
        if (base.elevation)
            Object.assign(finalTokens.elevation, base.elevation);
        if (base.layout)
            Object.assign(finalTokens.layout, base.layout);
        return finalTokens;
    }
    getThemeContract() {
        const tokens = this.resolveTokens();
        return {
            themeId: `theme_${this.activePreset}_${this.activeMode}`,
            name: `GeoSphere ${this.activePreset} ${this.activeMode}`,
            preset: this.activePreset,
            mode: this.activeMode,
            tokens,
            sdkTokens: (0, tokens_js_1.resolveSDKSemanticTokens)(tokens.colors)
        };
    }
    subscribe(listener) {
        this.listeners.add(listener);
        // Emit immediate current state to subscriber
        const contract = this.getThemeContract();
        listener(contract, contract.tokens);
        return () => {
            this.listeners.delete(listener);
        };
    }
    injectCssVariables() {
        if (typeof document === "undefined")
            return;
        const container = this.targetContainer || document.documentElement;
        const resolved = this.resolveTokens();
        const sdkSemantic = (0, tokens_js_1.resolveSDKSemanticTokens)(resolved.colors);
        // Colors
        Object.entries(resolved.colors).forEach(([key, val]) => {
            container.style.setProperty(`--geosphere-color-${this.camelToKebab(key)}`, val);
        });
        // Typography
        Object.entries(resolved.typography).forEach(([key, val]) => {
            container.style.setProperty(`--geosphere-font-${this.camelToKebab(key)}`, val);
        });
        // Spacing
        Object.entries(resolved.spacing).forEach(([key, val]) => {
            container.style.setProperty(`--geosphere-spacing-${key}`, val);
        });
        // Shape
        Object.entries(resolved.shape).forEach(([key, val]) => {
            container.style.setProperty(`--geosphere-radius-${this.camelToKebab(key)}`, val);
        });
        // Layout
        Object.entries(resolved.layout).forEach(([key, val]) => {
            container.style.setProperty(`--geosphere-layout-${this.camelToKebab(key)}`, val);
        });
        // SDK Semantic Tokens
        if (sdkSemantic.tracking) {
            Object.entries(sdkSemantic.tracking).forEach(([key, val]) => {
                if (val)
                    container.style.setProperty(`--geosphere-${this.camelToKebab(key)}`, val);
            });
        }
        if (sdkSemantic.geofence) {
            Object.entries(sdkSemantic.geofence).forEach(([key, val]) => {
                if (val)
                    container.style.setProperty(`--geosphere-${this.camelToKebab(key)}`, val);
            });
        }
        if (sdkSemantic.fieldForce) {
            Object.entries(sdkSemantic.fieldForce).forEach(([key, val]) => {
                if (val)
                    container.style.setProperty(`--geosphere-${this.camelToKebab(key)}`, val);
            });
        }
        container.setAttribute("data-geosphere-theme", this.activePreset);
        container.setAttribute("data-geosphere-mode", this.activeMode);
    }
    notifyAndInject() {
        this.injectCssVariables();
        const contract = this.getThemeContract();
        this.listeners.forEach((listener) => {
            try {
                listener(contract, contract.tokens);
            }
            catch (err) {
                console.error("[THEME_ENGINE_ERROR] Listener notification failed:", err);
            }
        });
    }
    camelToKebab(str) {
        return str.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
    }
}
exports.GeoSphereThemeEngine = GeoSphereThemeEngine;
//# sourceMappingURL=theme-engine.js.map