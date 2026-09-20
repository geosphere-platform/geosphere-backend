import { HTTPClient } from "../http/index.js";
import { License, APIResponse } from "../types/index.js";
export declare class LicensingModule {
    private http;
    constructor(http: HTTPClient);
    getLicense(): Promise<APIResponse<License>>;
    validateLicenseKey(licenseKey: string): Promise<APIResponse<{
        valid: boolean;
        license?: License;
    }>>;
}
//# sourceMappingURL=index.d.ts.map