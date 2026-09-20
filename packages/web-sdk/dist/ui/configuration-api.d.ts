/**
 * GeoSphere Runtime UI Configuration API Facade (GeoSphereUI)
 */
import { GeoSphereThemeContract, VisualStylePreset, ThemeMode, GeoSphereBrandingContract, GeoSphereLocaleConfigContract, DensityScale } from "../contracts/index.js";
import { GeoSphereThemeEngine } from "./theme-engine.js";
import { GeoSphereBrandingEngine } from "./branding-engine.js";
export interface GeoSphereUIConfigurationParams {
    visualStyle?: VisualStylePreset;
    mode?: ThemeMode;
    density?: DensityScale;
    branding?: Partial<GeoSphereBrandingContract>;
    locale?: Partial<GeoSphereLocaleConfigContract>;
    targetContainer?: HTMLElement | null;
}
export declare class GeoSphereUI {
    private static themeEngine;
    private static brandingEngine;
    private static activeDensity;
    static configure(params: GeoSphereUIConfigurationParams): void;
    static setTheme(mode: ThemeMode): void;
    static setVisualStyle(preset: VisualStylePreset): void;
    static setDensity(density: DensityScale): void;
    static getDensity(): DensityScale;
    static setBranding(branding: Partial<GeoSphereBrandingContract>): GeoSphereBrandingContract;
    static getBranding(): GeoSphereBrandingContract;
    static getTheme(): GeoSphereThemeContract;
    static getThemeEngine(): GeoSphereThemeEngine;
    static getBrandingEngine(): GeoSphereBrandingEngine;
}
//# sourceMappingURL=configuration-api.d.ts.map