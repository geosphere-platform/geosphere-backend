/**
 * GeoSphere Unified Configuration Contracts
 */
import { GeoSphereEnvironment } from "./core.contracts.js";
import { GeoSphereThemeContract } from "./theme.contracts.js";
import { GeoSphereBrandingContract } from "./branding.contracts.js";
import { GeoSphereLocaleConfigContract } from "./localization.contracts.js";
export interface GeoSphereCoreConfig {
    applicationId: string;
    apiBaseUrl: string;
    environment?: GeoSphereEnvironment;
    tenantId?: string;
    accessToken?: string;
    timeoutMs?: number;
    maxRetries?: number;
    headers?: Record<string, string>;
}
export interface GeoSphereUIConfigContract {
    theme?: Partial<GeoSphereThemeContract>;
    branding?: Partial<GeoSphereBrandingContract>;
    locale?: Partial<GeoSphereLocaleConfigContract>;
}
export type GeoSphereModuleConfigMap = Record<string, Record<string, unknown>>;
export interface GeoSpherePlatformConfig {
    core: GeoSphereCoreConfig;
    ui?: GeoSphereUIConfigContract;
    modules?: GeoSphereModuleConfigMap;
}
export declare function validatePlatformConfig(config: unknown): GeoSpherePlatformConfig;
//# sourceMappingURL=config.contracts.d.ts.map