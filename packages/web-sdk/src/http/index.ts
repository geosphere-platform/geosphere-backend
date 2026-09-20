import { GeoSphereSDKConfig, APIResponse } from "../types/index.js";
import { GeoSphereError, GeoSphereErrorCode } from "../errors/index.js";

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  timeoutMs?: number;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

export class HTTPClient {
  private baseUrl: string;
  private accessToken?: string;
  private tenantId?: string;
  private applicationId?: string;
  private timeoutMs: number;
  private maxRetries: number;
  private defaultHeaders: Record<string, string>;

  constructor(config: GeoSphereSDKConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.accessToken = config.accessToken;
    this.tenantId = config.tenantId;
    this.applicationId = config.applicationId;
    this.timeoutMs = config.timeoutMs || 15000;
    this.maxRetries = config.maxRetries ?? 2;
    this.defaultHeaders = config.headers || {};
  }

  public setAccessToken(token: string | undefined): void {
    this.accessToken = token;
  }

  public setTenantId(tenantId: string | undefined): void {
    this.tenantId = tenantId;
  }

  public setApplicationId(appId: string | undefined): void {
    this.applicationId = appId;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
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

  public async request<T>(
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<APIResponse<T>> {
    const url = this.buildUrl(path, options?.params);
    const requestId = this.generateRequestId();

    const headers: Record<string, string> = {
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

    let lastError: Error | null = null;
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

        const data = (await response.json()) as APIResponse<T>;

        if (!response.ok) {
          const code =
            response.status === 401
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

          throw new GeoSphereError(
            data.message || `HTTP Request failed with status ${response.status}`,
            code,
            response.status,
            data.error?.details,
            requestId
          );
        }

        return data;
      } catch (err: unknown) {
        clearTimeout(timer);
        if (err instanceof GeoSphereError) {
          throw err;
        }

        const isAbort = err instanceof Error && err.name === "AbortError";
        lastError = new GeoSphereError(
          isAbort ? `Request timed out after ${timeout}ms` : (err as Error).message || "Network error",
          isAbort ? GeoSphereErrorCode.TIMEOUT : GeoSphereErrorCode.NETWORK_ERROR,
          undefined,
          err,
          requestId
        );

        if (attempt === attempts - 1) {
          throw lastError;
        }
      }
    }

    throw lastError || new GeoSphereError("Unknown network failure", GeoSphereErrorCode.NETWORK_ERROR);
  }

  public get<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>("GET", path, undefined, options);
  }

  public post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>("POST", path, body, options);
  }

  public put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>("PUT", path, body, options);
  }

  public patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>("PATCH", path, body, options);
  }

  public delete<T>(path: string, options?: RequestOptions): Promise<APIResponse<T>> {
    return this.request<T>("DELETE", path, undefined, options);
  }
}
