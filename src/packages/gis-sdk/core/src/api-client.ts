import { SDKError, SDKErrorCode, normalizeBackendError } from "./errors";
import { TenantContextManager } from "./tenant-context";
import { TokenProvider, RetryPolicyConfig, Logger } from "./types";

export interface RequestOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
  timeoutMs?: number;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

export class ApiClient {
  private apiBaseUrl: string;
  private tenantContext: TenantContextManager;
  private tokenProvider: TokenProvider;
  private logger?: Logger;
  private defaultTimeoutMs: number;
  private retryPolicy: RetryPolicyConfig;

  constructor(
    apiBaseUrl: string,
    tenantContext: TenantContextManager,
    tokenProvider: TokenProvider,
    logger?: Logger,
    timeoutMs: number = 15000,
    retryPolicy?: Partial<RetryPolicyConfig>,
  ) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, "");
    this.tenantContext = tenantContext;
    this.tokenProvider = tokenProvider;
    this.logger = logger;
    this.defaultTimeoutMs = timeoutMs;
    this.retryPolicy = {
      maxRetries: retryPolicy?.maxRetries ?? 2,
      initialDelayMs: retryPolicy?.initialDelayMs ?? 300,
      maxDelayMs: retryPolicy?.maxDelayMs ?? 3000,
      backoffFactor: retryPolicy?.backoffFactor ?? 2,
    };
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${this.apiBaseUrl}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

    const timeout = options.timeoutMs ?? this.defaultTimeoutMs;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    const { organizationId, workspaceId } = this.tenantContext.getContext();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Organization-Id": organizationId,
      "X-Workspace-Id": workspaceId,
      "X-SDK-Name": "gis-web-sdk",
      "X-SDK-Version": "1.2.0",
      ...(options.headers || {}),
    };

    if (!options.skipAuth) {
      const token = await this.tokenProvider.getAccessToken();
      if (token) {
        if (token.startsWith("gsk_")) {
          headers["X-API-Key"] = token;
        } else {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }

    let attempt = 0;
    let delay = this.retryPolicy.initialDelayMs;

    try {
      while (attempt <= this.retryPolicy.maxRetries) {
        try {
          this.logger?.debug(`API Request: ${options.method || "GET"} ${url}`, {
            attempt,
          });
          const response = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
          });

          if (!response.ok) {
            let errorBody: any;
            try {
              errorBody = await response.json();
            } catch {
              errorBody = { message: await response.text() };
            }
            throw normalizeBackendError({
              statusCode: response.status,
              message:
                errorBody.message || errorBody.error || response.statusText,
              details: errorBody,
            });
          }

          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            return (await response.json()) as T;
          }
          return (await response.text()) as unknown as T;
        } catch (err: any) {
          if (err.name === "AbortError") {
            throw new SDKError(
              SDKErrorCode.TIMEOUT_ERROR,
              `Request timed out after ${timeout}ms`,
              408,
            );
          }

          const normalized = normalizeBackendError(err);

          // Retry on Network Error or 503 Service Unavailable
          if (
            attempt < this.retryPolicy.maxRetries &&
            (normalized.code === SDKErrorCode.NETWORK_ERROR ||
              normalized.statusCode === 503)
          ) {
            attempt++;
            this.logger?.warn(
              `API Request failed, retrying (${attempt}/${this.retryPolicy.maxRetries})...`,
            );
            await new Promise((res) => setTimeout(res, delay));
            delay = Math.min(
              delay * this.retryPolicy.backoffFactor,
              this.retryPolicy.maxDelayMs,
            );
            continue;
          }

          throw normalized;
        }
      }

      throw new SDKError(
        SDKErrorCode.NETWORK_ERROR,
        "Max retry attempts reached",
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get<T = any>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  public post<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T = any>(
    endpoint: string,
    body?: any,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T = any>(
    endpoint: string,
    options?: RequestOptions,
  ): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}
