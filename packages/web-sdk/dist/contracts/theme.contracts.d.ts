/**
 * GeoSphere Theme Engine & Design Token Contracts
 */
export type VisualStylePreset = "classic" | "modern" | "enterprise" | "minimal" | "glass" | "material" | "compact" | "dark-pro" | "high-contrast" | "custom";
export type ThemeMode = "light" | "dark" | "system";
export interface ColorTokens {
    primary: string;
    primaryForeground: string;
    secondary: string;
    secondaryForeground: string;
    background: string;
    surface: string;
    surfaceVariant: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
}
export interface TypographyTokens {
    fontFamily: string;
    fontFamilyMono: string;
    fontSizeXs: string;
    fontSizeSm: string;
    fontSizeMd: string;
    fontSizeLg: string;
    fontSizeXl: string;
}
export interface SpacingTokens {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
}
export interface ShapeTokens {
    radiusSmall: string;
    radiusMedium: string;
    radiusLarge: string;
    radiusFull: string;
}
export interface ElevationTokens {
    none: string;
    low: string;
    medium: string;
    high: string;
}
export interface LayoutBoundsTokens {
    sidebarWidth: string;
    toolbarHeight: string;
    contentPadding: string;
    panelWidth: string;
}
export interface DesignTokenContract {
    colors: ColorTokens;
    typography: TypographyTokens;
    spacing: SpacingTokens;
    shape: ShapeTokens;
    elevation: ElevationTokens;
    layout: LayoutBoundsTokens;
}
export interface TrackingSemanticTokens {
    trackingMovingColor: string;
    trackingIdleColor: string;
    trackingOfflineColor: string;
    trackingSpeedingColor: string;
}
export interface GeofenceSemanticTokens {
    geofenceInsideColor: string;
    geofenceOutsideColor: string;
    geofenceAlertColor: string;
}
export interface FieldForceSemanticTokens {
    taskPendingColor: string;
    taskInProgressColor: string;
    taskCompletedColor: string;
    taskOverdueColor: string;
}
export interface ReportingSemanticTokens {
    positiveMetricColor: string;
    negativeMetricColor: string;
    neutralMetricColor: string;
}
export interface SDKSemanticTokens {
    tracking?: Partial<TrackingSemanticTokens>;
    geofence?: Partial<GeofenceSemanticTokens>;
    fieldForce?: Partial<FieldForceSemanticTokens>;
    reporting?: Partial<ReportingSemanticTokens>;
}
export interface GeoSphereThemeContract {
    themeId: string;
    name: string;
    preset: VisualStylePreset;
    mode: ThemeMode;
    tokens: Partial<DesignTokenContract>;
    sdkTokens?: SDKSemanticTokens;
}
export interface ThemePrecedenceHierarchy {
    environmentDefault?: Partial<GeoSphereThemeContract>;
    tenantConfig?: Partial<GeoSphereThemeContract>;
    applicationConfig?: Partial<GeoSphereThemeContract>;
    userPreference?: Partial<GeoSphereThemeContract>;
    componentOverride?: Partial<GeoSphereThemeContract>;
}
export declare const DEFAULT_DESIGN_TOKENS: DesignTokenContract;
export declare function resolveThemePrecedence(hierarchy: ThemePrecedenceHierarchy): DesignTokenContract;
//# sourceMappingURL=theme.contracts.d.ts.map