import { GISSDK, ApiClient } from "@gis-sdk/core";

export interface GISRuleDefinition {
  id?: string;
  name: string;
  description?: string;
  enabled?: boolean;
  triggerType: "GEOFENCE" | "SPEED" | "SPATIAL_PROXIMITY" | "SCHEDULE";
  conditions: Record<string, any>;
  actions: Record<string, any>[];
  metadata?: Record<string, any>;
}

export interface GISAlert {
  id: string;
  ruleId?: string;
  title: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  timestamp: string;
  entityId?: string;
  metadata?: Record<string, any>;
}

export class RulesSDK {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  public async createRule(rule: GISRuleDefinition): Promise<GISRuleDefinition> {
    return this.apiClient.post("/api/v1/rules", rule);
  }

  public async updateRule(
    id: string,
    updates: Partial<GISRuleDefinition>,
  ): Promise<GISRuleDefinition> {
    return this.apiClient.put(`/api/v1/rules/${id}`, updates);
  }

  public async deleteRule(id: string): Promise<void> {
    return this.apiClient.delete(`/api/v1/rules/${id}`);
  }

  public async enableRule(id: string): Promise<void> {
    return this.apiClient.put(`/api/v1/rules/${id}/enable`);
  }

  public async disableRule(id: string): Promise<void> {
    return this.apiClient.put(`/api/v1/rules/${id}/disable`);
  }

  public async listRules(): Promise<GISRuleDefinition[]> {
    try {
      const res: any = await this.apiClient.get("/api/v1/rules");
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.rules)) return res.rules;
      return [];
    } catch {
      return [];
    }
  }
}

export class AlertsSDK {
  private apiClient: ApiClient;

  constructor(apiClient?: ApiClient) {
    this.apiClient = apiClient || GISSDK.getInstance().getApiClient();
  }

  public async listAlerts(filter?: {
    status?: string;
    severity?: string;
    limit?: number;
  }): Promise<GISAlert[]> {
    try {
      const params = new URLSearchParams(filter as any).toString();
      const res: any = await this.apiClient.get(
        `/api/v1/alerts${params ? "?" + params : ""}`,
      );
      if (Array.isArray(res)) return res;
      if (res && Array.isArray(res.data)) return res.data;
      if (res && Array.isArray(res.alerts)) return res.alerts;
      return [];
    } catch {
      return [];
    }
  }

  public async acknowledgeAlert(id: string): Promise<GISAlert> {
    return this.apiClient.put(`/api/v1/alerts/${id}/acknowledge`);
  }

  public async resolveAlert(id: string): Promise<GISAlert> {
    return this.apiClient.put(`/api/v1/alerts/${id}/resolve`);
  }
}
