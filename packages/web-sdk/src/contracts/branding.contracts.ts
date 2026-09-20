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

export function validateBrandingConfig(branding: unknown): GeoSphereBrandingContract {
  if (!branding || typeof branding !== "object") {
    throw new Error("[BRANDING_ERROR] Branding configuration must be a valid non-null object.");
  }
  const b = branding as Partial<GeoSphereBrandingContract>;
  if (!b.companyName || !b.applicationName) {
    throw new Error("[BRANDING_ERROR] Branding requires 'companyName' and 'applicationName'.");
  }
  return branding as GeoSphereBrandingContract;
}
