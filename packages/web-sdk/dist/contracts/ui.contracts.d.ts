/**
 * GeoSphere Framework-Neutral UI Component & Screen Contracts
 * Supports Web (React/Next.js), Android (Jetpack Compose), and iOS (SwiftUI) Target Platforms
 */
export type TargetPlatform = "web" | "android" | "ios";
export type EmbeddingMode = "full-screen" | "component";
export type UIComponentState = "loading" | "ready" | "empty" | "error" | "disabled" | "unauthorized" | "unavailable" | "offline";
export type DensityScale = "compact" | "comfortable" | "spacious";
export type BreakpointScale = "mobile" | "tablet" | "desktop" | "large-desktop";
export interface GeoSphereComponentProperty {
    name: string;
    type: string;
    required: boolean;
    defaultValue?: unknown;
    description: string;
}
export interface PlatformAdapterBinding {
    platform: TargetPlatform;
    componentSymbol: string;
    framework: "react" | "compose" | "swiftui" | "web-component";
}
export interface GeoSphereComponentDefinition {
    id: string;
    name: string;
    version: string;
    moduleId: string;
    description: string;
    inputs: GeoSphereComponentProperty[];
    outputs: string[];
    events: string[];
    requiredPermissions: string[];
    supportedPlatforms: TargetPlatform[];
    supportsDensity: DensityScale[];
    supportsBreakpoints: BreakpointScale[];
    adapters?: PlatformAdapterBinding[];
    themeRequirements?: string[];
    localizationKeys?: string[];
}
export interface GeoSphereScreenDefinition {
    id: string;
    title: string;
    version: string;
    moduleId: string;
    description: string;
    mode: EmbeddingMode;
    supportedPlatforms: TargetPlatform[];
    requiredCapabilities: string[];
    requiredPermissions: string[];
    containedComponents: string[];
    adapters?: PlatformAdapterBinding[];
    routePattern?: string;
}
export interface SDKThreeLayerContract<TApi = unknown> {
    readonly moduleId: string;
    readonly api: TApi;
    readonly components: GeoSphereComponentDefinition[];
    readonly screens: GeoSphereScreenDefinition[];
}
//# sourceMappingURL=ui.contracts.d.ts.map