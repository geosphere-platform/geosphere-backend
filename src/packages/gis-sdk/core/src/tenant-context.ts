import { SDKError, SDKErrorCode } from "./errors";

export interface TenantContext {
  organizationId: string;
  workspaceId: string;
}

export class TenantContextManager {
  private organizationId: string;
  private workspaceId: string;

  constructor(organizationId: string, workspaceId: string) {
    if (!organizationId || !workspaceId) {
      throw new SDKError(
        SDKErrorCode.TENANT_CONTEXT_ERROR,
        "Organization ID and Workspace ID are required for SDK initialization.",
      );
    }
    this.organizationId = organizationId;
    this.workspaceId = workspaceId;
  }

  public getContext(): TenantContext {
    return {
      organizationId: this.organizationId,
      workspaceId: this.workspaceId,
    };
  }

  public setTenantContext(organizationId: string, workspaceId: string): void {
    if (!organizationId || !workspaceId) {
      throw new SDKError(
        SDKErrorCode.TENANT_CONTEXT_ERROR,
        "Valid Organization ID and Workspace ID must be provided.",
      );
    }
    this.organizationId = organizationId;
    this.workspaceId = workspaceId;
  }

  public get organization(): string {
    return this.organizationId;
  }

  public get workspace(): string {
    return this.workspaceId;
  }
}
