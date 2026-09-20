import { HTTPClient } from "../http/index.js";
import { Application, APIResponse } from "../types/index.js";
export declare class ApplicationModule {
    private http;
    constructor(http: HTTPClient);
    getApplication(appId: string): Promise<APIResponse<Application>>;
    listApplications(): Promise<APIResponse<Application[]>>;
    switchApplication(appId: string): void;
}
//# sourceMappingURL=index.d.ts.map