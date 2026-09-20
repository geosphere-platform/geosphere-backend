/**
 * GeoSphere Branding Contracts
 */
export function validateBrandingConfig(branding) {
    if (!branding || typeof branding !== "object") {
        throw new Error("[BRANDING_ERROR] Branding configuration must be a valid non-null object.");
    }
    const b = branding;
    if (!b.companyName || !b.applicationName) {
        throw new Error("[BRANDING_ERROR] Branding requires 'companyName' and 'applicationName'.");
    }
    return branding;
}
//# sourceMappingURL=branding.contracts.js.map