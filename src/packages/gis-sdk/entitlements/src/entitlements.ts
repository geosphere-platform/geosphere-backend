import { GISSDK, ApiClient, SDKError, SDKErrorCode } from "@gis-sdk/core";

export interface FeatureCheckResult {
  featureKey: string;
  enabled: boolean;
}

export interface LimitCheckResult {
  limitKey: string;
  maxLimit: number;
}

export interface UsageCheckResult {
  metricKey: string;
  currentUsage: number;
}

export interface LicenseProvider {
  validateLicense(licenseKey: string): Promise<boolean>;
  getLicenseStatus(): Promise<{ valid: boolean; plan: string }>;
}

export class EntitlementsSDK {
  private apiClient: ApiClient;
  private cache: Map<string, any> = new Map();
  private cacheTtlMs: number = 60000; // 1 minute UX cache
  private lastFetchTime: number = 0;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  private async fetchEntitlements(): Promise<any> {
    const now = Date.now();
    if (
      this.cache.has("summary") &&
      now - this.lastFetchTime < this.cacheTtlMs
    ) {
      return this.cache.get("summary");
    }

    try {
      const summary = await this.apiClient.get(
        "/api/v1/subscription/entitlements",
      );
      this.cache.set("summary", summary);
      this.lastFetchTime = now;
      return summary;
    } catch (err: any) {
      // Fallback cache if available
      if (this.cache.has("summary")) {
        return this.cache.get("summary");
      }
      throw err;
    }
  }

  public async hasFeature(featureKey: string): Promise<boolean> {
    try {
      const summary = await this.fetchEntitlements();
      const feature = summary?.features?.find(
        (f: any) => f.featureKey === featureKey,
      );
      return feature ? feature.enabled : false;
    } catch {
      return false; // UX fallback only; backend will enforce strictly
    }
  }

  public async getLimit(limitKey: string): Promise<number> {
    try {
      const summary = await this.fetchEntitlements();
      const limitObj = summary?.limits?.find(
        (l: any) => l.limitKey === limitKey,
      );
      return limitObj ? limitObj.maxLimit : Infinity;
    } catch {
      return Infinity;
    }
  }

  public async getUsage(metricKey: string): Promise<number> {
    try {
      const summary = await this.fetchEntitlements();
      const usageObj = summary?.usage?.find(
        (u: any) => u.metricKey === metricKey,
      );
      return usageObj ? usageObj.currentUsage : 0;
    } catch {
      return 0;
    }
  }

  public clearCache(): void {
    this.cache.clear();
    this.lastFetchTime = 0;
  }
}
