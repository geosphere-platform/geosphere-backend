import { GeoSphereSDKConfig, APIResponse } from "../types/index.js";
export interface RequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean | undefined>;
    timeoutMs?: number;
    idempotencyKey?: string;
    signal?: AbortSignal;
}
export declare class HTTPClient {
    private baseUrl;
    private accessToken?;
    private tenantId?;
    private applicationId?;
    private timeoutMs;
    private maxRetries;
    private defaultHeaders;
    constructor(config: GeoSphereSDKConfig);
    setAccessToken(token: string | undefined): void;
    setTenantId(tenantId: string | undefined): void;
    setApplicationId(appId: string | undefined): void;
    private generateRequestId;
    private buildUrl;
    request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>>;
    get<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>>;
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>>;
    delete<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>>;
}
//# sourceMappingURL=index.d.ts.map