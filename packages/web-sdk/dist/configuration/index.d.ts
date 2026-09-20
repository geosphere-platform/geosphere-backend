import { HTTPClient } from "../http/index.js";
import { AppConfiguration, APIResponse } from "../types/index.js";
export declare class ConfigurationModule {
    private http;
    constructor(http: HTTPClient);
    getConfiguration(): Promise<APIResponse<AppConfiguration>>;
}
//# sourceMappingURL=index.d.ts.map