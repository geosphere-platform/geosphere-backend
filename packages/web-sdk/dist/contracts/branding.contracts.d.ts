/**
 * GeoSphere Branding Contracts
 */
export interface GeoSphereBrandingContract {
    applicationName: string;
    companyName: string;
    logoUrl?: string;
    iconUrl?: string;
    faviconUrl?: string;
    brandColors?: {
        primary?: string;
        accent?: string;
    };
    navigationLabels?: Record<string, string>;
    customIconMap?: Record<string, string>;
    moduleVisibility?: Record<string, boolean>;
}
export declare function validateBrandingConfig(branding: unknown): GeoSphereBrandingContract;
//# sourceMappingURL=branding.contracts.d.ts.map