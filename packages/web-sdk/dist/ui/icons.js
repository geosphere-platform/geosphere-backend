"use strict";
/**
 * GeoSphere Centralized Icon Strategy
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeoSphereIconRegistry = exports.COMMON_ICONS = void 0;
exports.COMMON_ICONS = {
    check: {
        name: "check",
        viewBox: "0 0 24 24",
        svgPath: "M5 13l4 4L19 7"
    },
    close: {
        name: "close",
        viewBox: "0 0 24 24",
        svgPath: "M6 18L18 6M6 6l12 12"
    },
    chevronDown: {
        name: "chevronDown",
        viewBox: "0 0 24 24",
        svgPath: "M19 9l-7 7-7-7"
    },
    spinner: {
        name: "spinner",
        viewBox: "0 0 24 24",
        svgPath: "M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
    },
    alert: {
        name: "alert",
        viewBox: "0 0 24 24",
        svgPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    },
    map: {
        name: "map",
        viewBox: "0 0 24 24",
        svgPath: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.818V8.036a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
    },
    vehicle: {
        name: "vehicle",
        viewBox: "0 0 24 24",
        svgPath: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z"
    }
};
class GeoSphereIconRegistry {
    static icons = new Map(Object.entries(exports.COMMON_ICONS));
    static registerIcon(name, definition) {
        this.icons.set(name, definition);
    }
    static getIcon(name) {
        return this.icons.get(name);
    }
    static listIcons() {
        return Array.from(this.icons.keys());
    }
}
exports.GeoSphereIconRegistry = GeoSphereIconRegistry;
//# sourceMappingURL=icons.js.map