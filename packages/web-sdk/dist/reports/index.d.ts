import { HTTPClient } from "../http/index.js";
import { APIResponse } from "../types/index.js";
export declare class ReportsModule {
    private http;
    constructor(http: HTTPClient);
    generateReport(type: string, params: Record<string, unknown>): Promise<APIResponse<{
        reportUrl: string;
    }>>;
}
//# sourceMappingURL=index.d.ts.map