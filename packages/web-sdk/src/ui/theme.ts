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

export type GeoSphereVisualStyle =
  | "Classic"
  | "Modern"
  | "Enterprise"
  | "Minimal"
  | "Material"
  | "Glass"
  | "Compact"
  | "Dark Pro"
  | "High Contrast";

export interface GeoSphereThemeConfig {
  stylePreset: GeoSphereVisualStyle;
  colors: GeoSphereColorTokens;
  typography: GeoSphereTypographyTokens;
  spacing: GeoSphereSpacingTokens;
  radius: GeoSphereRadiusTokens;
  brandName?: string;
  logoUrl?: string;
}

export const DEFAULT_GEOSPHERE_THEME: GeoSphereThemeConfig = {
  stylePreset: "Dark Pro",
  colors: {
    primary: "#6366f1",
    secondary: "#4f46e5",
    accent: "#38bdf8",
    background: "#020617",
    surface: "#0f172a",
    surfaceVariant: "#1e293b",
    textPrimary: "#f8fafc",
    textSecondary: "#94a3b8",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#f43f5e",
    info: "#0ea5e9",
    border: "#1e293b",
    divider: "#334155",
    overlay: "rgba(2, 6, 23, 0.75)"
  },
  typography: {
    display: "2rem",
    headline: "1.5rem",
    title: "1.125rem",
    body: "0.875rem",
    label: "0.75rem",
    caption: "0.625rem"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    xxl: "3rem"
  },
  radius: {
    small: "0.375rem",
    medium: "0.75rem",
    large: "1rem",
    pill: "9999px"
  },
  brandName: "GeoSphere Platform"
};

export class GeoSphereThemeManager {
  private static currentTheme: GeoSphereThemeConfig = { ...DEFAULT_GEOSPHERE_THEME };

  public static getTheme(): GeoSphereThemeConfig {
    return this.currentTheme;
  }

  public static setTheme(newTheme: Partial<GeoSphereThemeConfig>): GeoSphereThemeConfig {
    this.currentTheme = {
      ...this.currentTheme,
      ...newTheme,
      colors: { ...this.currentTheme.colors, ...newTheme.colors }
    };
    return this.currentTheme;
  }
}
