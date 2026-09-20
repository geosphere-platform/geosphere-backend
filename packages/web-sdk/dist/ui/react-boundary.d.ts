/**
 * GeoSphere React Integration Boundary & Context Providers
 * Fully compatible with React 19, Next.js 16 App Router, and SSR
 */
import React from "react";
import { GeoSphereThemeContract, DesignTokenContract, GeoSphereBrandingContract, DensityScale, VisualStylePreset, ThemeMode } from "../contracts/index.js";
interface GeoSphereUIContextValue {
    theme: GeoSphereThemeContract;
    tokens: DesignTokenContract;
    branding: GeoSphereBrandingContract;
    density: DensityScale;
    setMode: (mode: ThemeMode) => void;
    setVisualStyle: (preset: VisualStylePreset) => void;
    setDensity: (density: DensityScale) => void;
    setBranding: (branding: Partial<GeoSphereBrandingContract>) => void;
}
export interface GeoSphereThemeProviderProps {
    children: React.ReactNode;
    initialMode?: ThemeMode;
    initialVisualStyle?: VisualStylePreset;
    initialDensity?: DensityScale;
    initialBranding?: Partial<GeoSphereBrandingContract>;
}
export declare function GeoSphereThemeProvider({ children, initialMode, initialVisualStyle, initialDensity, initialBranding }: GeoSphereThemeProviderProps): React.JSX.Element;
export declare function useGeoSphereUIContext(): GeoSphereUIContextValue;
export declare function useGeoSphereTheme(): {
    theme: GeoSphereThemeContract;
    tokens: DesignTokenContract;
    setMode: (mode: ThemeMode) => void;
    setVisualStyle: (preset: VisualStylePreset) => void;
};
export declare function useGeoSphereBranding(): {
    branding: GeoSphereBrandingContract;
    setBranding: (branding: Partial<GeoSphereBrandingContract>) => void;
};
export declare function useGeoSphereDensity(): {
    density: DensityScale;
    setDensity: (density: DensityScale) => void;
};
export {};
//# sourceMappingURL=react-boundary.d.ts.map