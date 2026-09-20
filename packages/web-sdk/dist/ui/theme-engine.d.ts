/**
 * GeoSphere Theme Engine & CSS Custom Property Injector
 */
import { DesignTokenContract, VisualStylePreset, ThemeMode, GeoSphereThemeContract, ThemePrecedenceHierarchy } from "../contracts/theme.contracts.js";
export type ThemeChangeListener = (theme: GeoSphereThemeContract, resolvedTokens: DesignTokenContract) => void;
export declare class GeoSphereThemeEngine {
    private activePreset;
    private activeMode;
    private hierarchy;
    private listeners;
    private targetContainer;
    constructor(initialHierarchy?: ThemePrecedenceHierarchy, targetElement?: HTMLElement);
    setTargetContainer(element: HTMLElement | null): void;
    setMode(mode: ThemeMode): void;
    getMode(): ThemeMode;
    setVisualStyle(preset: VisualStylePreset): void;
    getVisualStyle(): VisualStylePreset;
    setHierarchy(hierarchy: ThemePrecedenceHierarchy): void;
    getHierarchy(): ThemePrecedenceHierarchy;
    resolveTokens(): DesignTokenContract;
    getThemeContract(): GeoSphereThemeContract;
    subscribe(listener: ThemeChangeListener): () => void;
    injectCssVariables(): void;
    private notifyAndInject;
    private camelToKebab;
}
//# sourceMappingURL=theme-engine.d.ts.map