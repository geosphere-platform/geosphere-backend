/**
 * GeoSphere Localization Contracts
 */
export function validateLocaleConfig(localeConfig) {
    if (!localeConfig || typeof localeConfig !== "object") {
        throw new Error("[LOCALIZATION_ERROR] Locale configuration must be a valid non-null object.");
    }
    const l = localeConfig;
    if (!l.language || !l.locale || !l.timezone) {
        throw new Error("[LOCALIZATION_ERROR] Locale configuration requires 'language', 'locale', and 'timezone'.");
    }
    return localeConfig;
}
//# sourceMappingURL=localization.contracts.js.map