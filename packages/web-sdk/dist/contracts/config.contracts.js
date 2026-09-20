/**
 * GeoSphere Unified Configuration Contracts
 */
export function validatePlatformConfig(config) {
    if (!config || typeof config !== "object") {
        throw new Error("[CONFIG_ERROR] Configuration must be a valid non-null object.");
    }
    const cfg = config;
    if (!cfg.core || !cfg.core.applicationId || !cfg.core.apiBaseUrl) {
        throw new Error("[CONFIG_ERROR] Core configuration requires 'applicationId' and 'apiBaseUrl'.");
    }
    return config;
}
//# sourceMappingURL=config.contracts.js.map