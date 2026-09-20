/**
 * GeoSphere Core Platform Contracts & Lifecycle Interfaces
 * Framework-Neutral Foundational Contracts for all GeoSphere SDKs
 */
import { Environment } from "../types/index.js";
export type GeoSphereEnvironment = Environment;
export type GeoSphereLifecycleState = "uninitialized" | "initializing" | "ready" | "destroyed" | "error";
export interface SDKCapabilityMetadata {
    id: string;
    name: string;
    description: string;
    experimental?: boolean;
}
export interface ModuleCapabilities {
    moduleId: string;
    capabilities: string[];
    metadata?: SDKCapabilityMetadata[];
}
export interface GeoSphereModuleContract {
    readonly id: string;
    readonly version: string;
    readonly capabilities: string[];
    initialize(runtime: GeoSphereRuntimeContract): Promise<void>;
    destroy(): Promise<void>;
    getCapabilities(): ModuleCapabilities;
}
export interface GeoSphereRuntimeContract {
    readonly environment: GeoSphereEnvironment;
    readonly applicationId: string;
    readonly tenantId?: string;
    readonly state: GeoSphereLifecycleState;
    registerModule(module: GeoSphereModuleContract): void;
    getModule<T extends GeoSphereModuleContract>(id: string): T | undefined;
    listModules(): GeoSphereModuleContract[];
    listCapabilities(): ModuleCapabilities[];
}
export interface GeoSphereCoreContract {
    readonly runtime: GeoSphereRuntimeContract;
    initialize(config: Record<string, unknown>): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=core.contracts.d.ts.map