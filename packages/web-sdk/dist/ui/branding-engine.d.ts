/**
 * GeoSphere Runtime White-Label Branding Engine
 */
import { GeoSphereBrandingContract } from "../contracts/index.js";
export type BrandingChangeListener = (branding: GeoSphereBrandingContract) => void;
export declare const DEFAULT_BRANDING: GeoSphereBrandingContract;
export declare class GeoSphereBrandingEngine {
    private activeBranding;
    private listeners;
    constructor(initialBranding?: Partial<GeoSphereBrandingContract>);
    getBranding(): GeoSphereBrandingContract;
    updateBranding(update: Partial<GeoSphereBrandingContract>): GeoSphereBrandingContract;
    isModuleVisible(moduleId: string): boolean;
    subscribe(listener: BrandingChangeListener): () => void;
    private notifyListeners;
}
//# sourceMappingURL=branding-engine.d.ts.map