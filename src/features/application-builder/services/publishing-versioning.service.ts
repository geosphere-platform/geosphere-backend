/**
 * Publishing, Versioning, Snapshot, Rollback & Cloning Engine
 */

import {
  ApplicationConfig,
  ValidationResult,
} from "../types/application.types";
import { configurationValidatorService } from "./configuration-validator.service";

export interface VersionSnapshotModel {
  id: string;
  applicationId: string;
  tenantId: string;
  version: number;
  status: string;
  snapshot: ApplicationConfig;
  changeSummary: string;
  publishedBy?: string;
  publishedAt: string;
}

export class PublishingVersioningService {
  /**
   * Sanitizes configuration payload for export (removing sensitive credentials/tokens).
   */
  public sanitizeForExport(config: ApplicationConfig): ApplicationConfig {
    const exported = JSON.parse(JSON.stringify(config)) as ApplicationConfig;
    // Strip out secrets or private credentials if present
    if (exported.subscriptionEntitlements) {
      delete exported.subscriptionEntitlements.apiKeySecret;
    }
    return exported;
  }

  /**
   * Prepares a configuration snapshot for publishing.
   */
  public preparePublishSnapshot(
    applicationId: string,
    tenantId: string,
    currentVersion: number,
    config: ApplicationConfig,
    changeSummary: string,
    userId?: string,
  ): {
    validation: ValidationResult;
    newVersion: number;
    snapshotPayload: any;
  } {
    const validation = configurationValidatorService.validate(config);
    if (!validation.isValid) {
      return {
        validation,
        newVersion: currentVersion,
        snapshotPayload: null,
      };
    }

    const newVersion = currentVersion + 1;
    const snapshotPayload = {
      applicationId,
      tenantId,
      version: newVersion,
      status: "PUBLISHED",
      snapshot: config,
      changeSummary: changeSummary || `Published version ${newVersion}`,
      publishedBy: userId || null,
      publishedAt: new Date().toISOString(),
    };

    return {
      validation,
      newVersion,
      snapshotPayload,
    };
  }

  /**
   * Generates a cloned application configuration with a modified name/code.
   */
  public cloneConfiguration(
    sourceAppName: string,
    sourceAppCode: string,
    sourceConfig: ApplicationConfig,
    targetEnv: "DEVELOPMENT" | "STAGING" | "PRODUCTION",
  ): {
    newName: string;
    newCode: string;
    clonedConfig: ApplicationConfig;
  } {
    const suffix = targetEnv.toLowerCase();
    const newName = `${sourceAppName} (${targetEnv})`;
    const newCode = `${sourceAppCode}_${suffix}`;
    const clonedConfig = JSON.parse(
      JSON.stringify(sourceConfig),
    ) as ApplicationConfig;

    clonedConfig.branding.appTitle = `${clonedConfig.branding.appTitle} [${targetEnv}]`;

    return {
      newName,
      newCode,
      clonedConfig,
    };
  }
}

export const publishingVersioningService = new PublishingVersioningService();
