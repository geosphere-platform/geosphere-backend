/**
 * GeoSphere Central Design System — Theme System & Token Architecture
 * Standardized design tokens across Web, Android (Compose), and iOS (SwiftUI).
 */
export interface GeoSphereColorTokens {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    textPrimary: string;
    textSecondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    border: string;
    divider: string;
    overlay: string;
}
export interface GeoSphereTypographyTokens {
    display: string;
    headline: string;
    title: string;
    body: string;
    label: string;
    caption: string;
}
export interface GeoSphereSpacingTokens {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
}
export interface GeoSphereRadiusTokens {
    small: string;
    medium: string;
    large: string;
    pill: string;
}
export type GeoSphereVisualStyle = "Classic" | "Modern" | "Enterprise" | "Minimal" | "Material" | "Glass" | "Compact" | "Dark Pro" | "High Contrast";
export interface GeoSphereThemeConfig {
    stylePreset: GeoSphereVisualStyle;
    colors: GeoSphereColorTokens;
    typography: GeoSphereTypographyTokens;
    spacing: GeoSphereSpacingTokens;
    radius: GeoSphereRadiusTokens;
    brandName?: string;
    logoUrl?: string;
}
export declare const DEFAULT_GEOSPHERE_THEME: GeoSphereThemeConfig;
export declare class GeoSphereThemeManager {
    private static currentTheme;
    static getTheme(): GeoSphereThemeConfig;
    static setTheme(newTheme: Partial<GeoSphereThemeConfig>): GeoSphereThemeConfig;
}
//# sourceMappingURL=theme.d.ts.map