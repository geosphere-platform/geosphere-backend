"use strict";
/**
 * GeoSphere 3-Tier Design Token System & Visual Style Presets
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISUAL_STYLE_PRESETS = exports.GLOBAL_TOKENS = void 0;
exports.resolveComponentTokens = resolveComponentTokens;
exports.resolveSDKSemanticTokens = resolveSDKSemanticTokens;
// Tier 1: Global Primitive Tokens
exports.GLOBAL_TOKENS = {
    colors: {
        primary: "#2563EB",
        primaryForeground: "#FFFFFF",
        secondary: "#64748B",
        secondaryForeground: "#F8FAFC",
        background: "#090D16",
        surface: "#1E293B",
        surfaceVariant: "#0F172A",
        text: "#F8FAFC",
        textSecondary: "#94A3B8",
        border: "#334155",
        success: "#10B981",
        warning: "#F59E0B",
        error: "#EF4444",
        info: "#3B82F6"
    },
    typography: {
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        fontFamilyMono: "JetBrains Mono, monospace",
        fontSizeXs: "11px",
        fontSizeSm: "13px",
        fontSizeMd: "15px",
        fontSizeLg: "18px",
        fontSizeXl: "24px"
    },
    spacing: {
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px"
    },
    shape: {
        radiusSmall: "4px",
        radiusMedium: "8px",
        radiusLarge: "16px",
        radiusFull: "9999px"
    },
    elevation: {
        none: "none",
        low: "0 1px 3px rgba(0,0,0,0.12)",
        medium: "0 4px 6px -1px rgba(0,0,0,0.2)",
        high: "0 20px 25px -5px rgba(0,0,0,0.3)"
    },
    layout: {
        sidebarWidth: "280px",
        toolbarHeight: "56px",
        contentPadding: "16px",
        panelWidth: "360px"
    }
};
// Tier 2: Visual Style Preset Configurations
exports.VISUAL_STYLE_PRESETS = {
    classic: {
        colors: { ...exports.GLOBAL_TOKENS.colors },
        shape: { ...exports.GLOBAL_TOKENS.shape, radiusMedium: "4px" },
        spacing: { ...exports.GLOBAL_TOKENS.spacing }
    },
    modern: {
        colors: {
            ...exports.GLOBAL_TOKENS.colors,
            primary: "#3B82F6",
            surface: "#1E293B",
            background: "#0F172A"
        },
        shape: { ...exports.GLOBAL_TOKENS.shape, radiusMedium: "12px", radiusLarge: "20px" },
        elevation: {
            ...exports.GLOBAL_TOKENS.elevation,
            medium: "0 10px 15px -3px rgba(0, 0, 0, 0.3)"
        }
    },
    enterprise: {
        colors: {
            ...exports.GLOBAL_TOKENS.colors,
            primary: "#1E40AF",
            surface: "#1E293B",
            background: "#0F172A",
            text: "#F1F5F9"
        },
        shape: { radiusSmall: "2px", radiusMedium: "4px", radiusLarge: "8px", radiusFull: "9999px" },
        spacing: { xs: "2px", sm: "6px", md: "12px", lg: "18px", xl: "24px", "2xl": "36px" }
    },
    minimal: {
        colors: {
            ...exports.GLOBAL_TOKENS.colors,
            primary: "#F8FAFC",
            surface: "#090D16",
            background: "#030712",
            border: "#1E293B"
        },
        shape: { radiusSmall: "0px", radiusMedium: "0px", radiusLarge: "0px", radiusFull: "0px" },
        elevation: { none: "none", low: "none", medium: "none", high: "none" }
    },
    glass: {
        colors: {
            ...exports.GLOBAL_TOKENS.colors,
            primary: "#8B5CF6",
            surface: "rgba(30, 41, 59, 0.6)",
            surfaceVariant: "rgba(15, 23, 42, 0.7)",
            border: "rgba(255, 255, 255, 0.15)"
        },
        shape: { radiusSmall: "8px", radiusMedium: "16px", radiusLarge: "24px", radiusFull: "9999px" },
        elevation: { ...exports.GLOBAL_TOKENS.elevation, medium: "0 8px 32px 0 rgba(0, 0, 0, 0.37)" }
    },
    material: {
        colors: {
            ...exports.GLOBAL_TOKENS.colors,
            primary: "#6200EE",
            secondary: "#03DAC6"
        },
        shape: { radiusSmall: "4px", radiusMedium: "8px", radiusLarge: "16px", radiusFull: "9999px" },
        elevation: { ...exports.GLOBAL_TOKENS.elevation, high: "0 8px 10px -5px rgba(0,0,0,0.2), 0 16px 24px 2px rgba(0,0,0,0.14)" }
    },
    compact: {
        colors: { ...exports.GLOBAL_TOKENS.colors },
        typography: { ...exports.GLOBAL_TOKENS.typography, fontSizeMd: "13px", fontSizeSm: "11px" },
        spacing: { xs: "2px", sm: "4px", md: "8px", lg: "12px", xl: "16px", "2xl": "24px" },
        shape: { radiusSmall: "2px", radiusMedium: "4px", radiusLarge: "6px", radiusFull: "9999px" }
    },
    "dark-pro": {
        colors: {
            primary: "#00F0FF",
            primaryForeground: "#000000",
            secondary: "#39FF14",
            secondaryForeground: "#000000",
            background: "#030712",
            surface: "#0B0F19",
            surfaceVariant: "#111827",
            text: "#F9FAFB",
            textSecondary: "#9CA3AF",
            border: "#1F2937",
            success: "#39FF14",
            warning: "#FFB800",
            error: "#FF0055",
            info: "#00F0FF"
        },
        shape: { radiusSmall: "4px", radiusMedium: "8px", radiusLarge: "12px", radiusFull: "9999px" }
    },
    "high-contrast": {
        colors: {
            primary: "#FFFF00",
            primaryForeground: "#000000",
            secondary: "#FFFFFF",
            secondaryForeground: "#000000",
            background: "#000000",
            surface: "#000000",
            surfaceVariant: "#000000",
            text: "#FFFFFF",
            textSecondary: "#FFFF00",
            border: "#FFFFFF",
            success: "#00FF00",
            warning: "#FFFF00",
            error: "#FF0000",
            info: "#00FFFF"
        },
        shape: { radiusSmall: "0px", radiusMedium: "0px", radiusLarge: "0px", radiusFull: "0px" }
    },
    custom: {
        colors: { ...exports.GLOBAL_TOKENS.colors }
    }
};
function resolveComponentTokens(tokens) {
    const t = tokens || { ...exports.GLOBAL_TOKENS };
    return {
        button: {
            primaryBg: t.colors.primary,
            primaryText: t.colors.primaryForeground,
            radius: t.shape.radiusMedium,
            padding: `${t.spacing.sm} ${t.spacing.md}`
        },
        card: {
            bg: t.colors.surface,
            border: t.colors.border,
            radius: t.shape.radiusMedium,
            shadow: t.elevation.medium
        },
        input: {
            bg: t.colors.surfaceVariant,
            border: t.colors.border,
            text: t.colors.text,
            radius: t.shape.radiusSmall
        }
    };
}
// SDK Semantic Token Generator
function resolveSDKSemanticTokens(colors) {
    const c = { ...exports.GLOBAL_TOKENS.colors, ...colors };
    return {
        tracking: {
            trackingMovingColor: c.success,
            trackingIdleColor: c.warning,
            trackingOfflineColor: c.secondary,
            trackingSpeedingColor: c.error
        },
        geofence: {
            geofenceInsideColor: `rgba(16, 185, 129, 0.25)`,
            geofenceOutsideColor: `rgba(100, 116, 139, 0.25)`,
            geofenceAlertColor: `rgba(239, 68, 68, 0.35)`
        },
        fieldForce: {
            taskPendingColor: c.info,
            taskInProgressColor: c.warning,
            taskCompletedColor: c.success,
            taskOverdueColor: c.error
        },
        reporting: {
            positiveMetricColor: c.success,
            negativeMetricColor: c.error,
            neutralMetricColor: c.secondary
        }
    };
}
//# sourceMappingURL=tokens.js.map