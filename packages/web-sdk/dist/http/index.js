import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";
export class HTTPClient {
    baseUrl;
    accessToken;
    tenantId;
    applicationId;
    timeoutMs;
    maxRetries;
    defaultHeaders;
    constructor(config) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, "");
        this.accessToken = config.accessToken;
        this.tenantId = config.tenantId;
        this.applicationId = config.applicationId;
        this.timeoutMs = config.timeoutMs || 15000;
        this.maxRetries = config.maxRetries ?? 2;
        this.defaultHeaders = config.headers || {};
    }
    setAccessToken(token) {
        this.accessToken = token;
    }
    setTenantId(tenantId) {
        this.tenantId = tenantId;
    }
    setApplicationId(appId) {
        this.applicationId = appId;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    buildUrl(path, params) {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        const url = new URL(`${this.baseUrl}${cleanPath}`);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    url.searchParams.append(key, String(value));
                }
            });
        }
        return url.toString();
    }
    async request(method, path, body, options) {
        const url = this.buildUrl(path, options?.params);
        const requestId = this.generateRequestId();
        const headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Request-ID": requestId,
            ...this.defaultHeaders,
            ...options?.headers
        };
        if (this.accessToken) {
            headers["Authorization"] = `Bearer ${this.accessToken}`;
        }
        if (this.tenantId) {
            headers["X-Tenant-ID"] = this.tenantId;
        }
        if (this.applicationId) {
            headers["X-Application-ID"] = this.applicationId;
        }
        if (options?.idempotencyKey) {
            headers["X-Idempotency-Key"] = options.idempotencyKey;
        }
        const timeout = options?.timeoutMs || this.timeoutMs;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);
        let lastError = null;
        const attempts = method === "GET" ? this.maxRetries + 1 : 1;
        for (let attempt = 0; attempt < attempts; attempt++) {
            try {
                const response = await fetch(url, {
                    method,
                    headers,
                    body: body ? JSON.stringify(body) : undefined,
                    signal: options?.signal || controller.signal
                });
                clearTimeout(timer);
                const data = (await response.json());
                if (!response.ok) {
                    const code = response.status === 401
                        ? GeoSphereErrorCode.UNAUTHORIZED
                        : response.status === 403
                            ? GeoSphereErrorCode.FORBIDDEN
                            : response.status === 404
                                ? GeoSphereErrorCode.NOT_FOUND
                                : response.status === 429
                                    ? GeoSphereErrorCode.RATE_LIMITED
                                    : response.status >= 500
                                        ? GeoSphereErrorCode.SERVER_ERROR
                                        : GeoSphereErrorCode.VALIDATION_ERROR;
                    throw new GeoSphereError(data.message || `HTTP Request failed with status ${response.status}`, code, response.status, data.error?.details, requestId);
                }
                return data;
            }
            catch (err) {
                clearTimeout(timer);
                if (err instanceof GeoSphereError) {
                    throw err;
                }
                const isAbort = err instanceof Error && err.name === "AbortError";
                lastError = new GeoSphereError(isAbort ? `Request timed out after ${timeout}ms` : err.message || "Network error", isAbort ? GeoSphereErrorCode.TIMEOUT : GeoSphereErrorCode.NETWORK_ERROR, undefined, err, requestId);
                if (attempt === attempts - 1) {
                    throw lastError;
                }
            }
        }
        throw lastError || new GeoSphereError("Unknown network failure", GeoSphereErrorCode.NETWORK_ERROR);
    }
    get(path, options) {
        return this.request("GET", path, undefined, options);
    }
    post(path, body, options) {
        return this.request("POST", path, body, options);
    }
    put(path, body, options) {
        return this.request("PUT", path, body, options);
    }
    patch(path, body, options) {
        return this.request("PATCH", path, body, options);
    }
    delete(path, options) {
        return this.request("DELETE", path, undefined, options);
    }
}
//# sourceMappingURL=index.js.map