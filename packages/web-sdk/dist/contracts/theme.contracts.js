/**
 * GeoSphere Theme Engine & Design Token Contracts
 */
export const DEFAULT_DESIGN_TOKENS = {
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
        fontFamily: "Inter, system-ui, sans-serif",
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
export function resolveThemePrecedence(hierarchy) {
    const merged = JSON.parse(JSON.stringify(DEFAULT_DESIGN_TOKENS));
    const layers = [
        hierarchy.environmentDefault,
        hierarchy.tenantConfig,
        hierarchy.applicationConfig,
        hierarchy.userPreference,
        hierarchy.componentOverride
    ];
    layers.forEach((layer) => {
        if (!layer || !layer.tokens)
            return;
        if (layer.tokens.colors)
            Object.assign(merged.colors, layer.tokens.colors);
        if (layer.tokens.typography)
            Object.assign(merged.typography, layer.tokens.typography);
        if (layer.tokens.spacing)
            Object.assign(merged.spacing, layer.tokens.spacing);
        if (layer.tokens.shape)
            Object.assign(merged.shape, layer.tokens.shape);
        if (layer.tokens.elevation)
            Object.assign(merged.elevation, layer.tokens.elevation);
        if (layer.tokens.layout)
            Object.assign(merged.layout, layer.tokens.layout);
    });
    return merged;
}
//# sourceMappingURL=theme.contracts.js.map