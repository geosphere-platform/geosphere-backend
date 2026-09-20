import { GISSDKConfig } from "./types";
import { TenantContextManager } from "./tenant-context";
import { ApiClient } from "./api-client";
import { AuthContext } from "./auth-context";
import { MemoryTokenProvider } from "./token-provider";
import { SDKLogger } from "./logger";
import { SDKEventEmitter } from "./event-emitter";
import { SDKError, SDKErrorCode } from "./errors";

export class GISSDK {
  private static instance: GISSDK | null = null;
  private config: GISSDKConfig;
  private tenantManager: TenantContextManager;
  private authContext: AuthContext;
  private apiClient: ApiClient;
  private logger: SDKLogger;
  private eventEmitter: SDKEventEmitter;

  private constructor(config: GISSDKConfig) {
    this.config = config;
    this.tenantManager = new TenantContextManager(
      config.organizationId,
      config.workspaceId,
    );

    const tokenProvider =
      config.tokenProvider || new MemoryTokenProvider(config.accessToken);
    this.authContext = new AuthContext(tokenProvider);
    this.logger = new SDKLogger(config.logger);
    this.eventEmitter = new SDKEventEmitter();

    this.apiClient = new ApiClient(
      config.apiBaseUrl,
      this.tenantManager,
      tokenProvider,
      this.logger,
      config.timeoutMs,
      config.retryPolicy,
    );

    this.logger.info("GIS SDK Core initialized successfully", {
      environment: config.environment || "production",
      organizationId: config.organizationId,
      workspaceId: config.workspaceId,
    });
  }

  public static configure(config: GISSDKConfig): GISSDK {
    if (!config.apiBaseUrl) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        "apiBaseUrl is required in GISSDK configuration",
      );
    }
    if (!config.organizationId || !config.workspaceId) {
      throw new SDKError(
        SDKErrorCode.TENANT_CONTEXT_ERROR,
        "organizationId and workspaceId are required in GISSDK configuration",
      );
    }

    GISSDK.instance = new GISSDK(config);
    return GISSDK.instance;
  }

  public static getInstance(): GISSDK {
    if (!GISSDK.instance) {
      throw new SDKError(
        SDKErrorCode.VALIDATION_ERROR,
        "GISSDK has not been configured. Call GISSDK.configure(...) first.",
      );
    }
    return GISSDK.instance;
  }

  public static isInitialized(): boolean {
    return GISSDK.instance !== null;
  }

  public static reset(): void {
    GISSDK.instance = null;
  }

  public getConfig(): GISSDKConfig {
    return this.config;
  }

  public getApiClient(): ApiClient {
    return this.apiClient;
  }

  public getTenantManager(): TenantContextManager {
    return this.tenantManager;
  }

  public getAuthContext(): AuthContext {
    return this.authContext;
  }

  public getLogger(): SDKLogger {
    return this.logger;
  }

  public getEventBus(): SDKEventEmitter {
    return this.eventEmitter;
  }

  public on(event: string, callback: (...args: any[]) => void): () => void {
    return this.eventEmitter.on(event, callback);
  }

  public emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }
}
