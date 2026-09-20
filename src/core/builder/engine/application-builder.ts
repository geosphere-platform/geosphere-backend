/**
 * Framework-Independent ApplicationBuilder Engine Class
 *
 * Manages customer application draft creation, schema validation, sandboxing guards,
 * versioned publication state machine (DRAFT -> PUBLISHED), version history tracking, and rollback.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import { ApplicationConfig, VersionHistoryEntry, BuilderError } from "../types/builder.types";
import { ConfigValidator } from "../validator/config-validator";

export class ApplicationBuilder {
  private readonly configs = new Map<string, ApplicationConfig>();
  private readonly history = new Map<string, VersionHistoryEntry[]>(); // ConfigID -> History Entries
  private readonly validator: ConfigValidator;

  constructor(validator?: ConfigValidator) {
    this.validator = validator ?? new ConfigValidator();
  }

  /**
   * Create new draft ApplicationConfig
   */
  public createDraft(
    tenantId: string,
    name: string,
    templateId?: string,
    initialConfig?: Partial<ApplicationConfig>,
  ): ApplicationConfig {
    const id = initialConfig?.id ?? `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const config: ApplicationConfig = {
      id,
      tenantId,
      name,
      version: 1,
      status: "DRAFT",
      templateId,
      theme: initialConfig?.theme ?? { primaryColor: "#1E293B", accentColor: "#10B981", darkMode: true },
      modules: initialConfig?.modules ?? { enabledEngines: ["MAP", "LOCATION"] },
      formSchemas: initialConfig?.formSchemas ?? [],
      taskWorkflows: initialConfig?.taskWorkflows ?? [],
      geofences: initialConfig?.geofences ?? [],
      notificationRules: initialConfig?.notificationRules ?? [],
      createdAt: now,
      updatedAt: now,
    };

    this.validator.validateConfig(config);
    this.configs.set(config.id, { ...config });
    this.history.set(config.id, []);
    return config;
  }

  public getConfig(id: string): ApplicationConfig | null {
    const cfg = this.configs.get(id);
    return cfg ? { ...cfg } : null;
  }

  /**
   * Validate ApplicationConfig structure & security sandboxing
   */
  public validateConfig(config: ApplicationConfig): boolean {
    this.validator.validateConfig(config);
    return true;
  }

  /**
   * Update draft configuration
   */
  public updateDraft(id: string, updates: Partial<ApplicationConfig>): ApplicationConfig {
    const existing = this.configs.get(id);
    if (!existing) {
      throw new BuilderError("CONFIG_NOT_FOUND", `ApplicationConfig '${id}' not found`);
    }

    const updated: ApplicationConfig = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.validator.validateConfig(updated);
    this.configs.set(id, updated);
    return updated;
  }

  /**
   * Publish ApplicationConfig: Draft -> Validation -> Versioned Publish
   */
  public publishConfig(id: string, publishedBy: string = "system"): ApplicationConfig {
    const existing = this.configs.get(id);
    if (!existing) {
      throw new BuilderError("CONFIG_NOT_FOUND", `ApplicationConfig '${id}' not found`);
    }

    this.validator.validateConfig(existing);

    const newVersion = existing.version + 1;
    const now = new Date().toISOString();

    const published: ApplicationConfig = {
      ...existing,
      version: newVersion,
      status: "PUBLISHED",
      publishedAt: now,
      updatedAt: now,
    };

    const historyEntry: VersionHistoryEntry = {
      versionId: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      configId: id,
      version: newVersion,
      snapshot: { ...published },
      publishedBy,
      publishedAt: now,
      changeSummary: `Published version ${newVersion}`,
    };

    const histList = this.history.get(id) ?? [];
    histList.push(historyEntry);
    this.history.set(id, histList);

    this.configs.set(id, published);
    return published;
  }

  /**
   * Rollback ApplicationConfig to a target version
   */
  public rollbackVersion(id: string, targetVersion: number, rolledBackBy: string = "system"): ApplicationConfig {
    const histList = this.history.get(id);
    if (!histList || histList.length === 0) {
      throw new BuilderError("VERSION_NOT_FOUND", `No publication history for ApplicationConfig '${id}'`);
    }

    const match = histList.find((h) => h.version === targetVersion);
    if (!match) {
      throw new BuilderError("VERSION_NOT_FOUND", `Version ${targetVersion} not found in history for '${id}'`);
    }

    const current = this.configs.get(id);
    const newVersion = (current?.version ?? 1) + 1;
    const now = new Date().toISOString();

    const rollbacked: ApplicationConfig = {
      ...match.snapshot,
      version: newVersion,
      status: "PUBLISHED",
      publishedAt: now,
      updatedAt: now,
    };

    const newHistoryEntry: VersionHistoryEntry = {
      versionId: `ver_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      configId: id,
      version: newVersion,
      snapshot: { ...rollbacked },
      publishedBy: rolledBackBy,
      publishedAt: now,
      changeSummary: `Rolled back to version ${targetVersion}`,
    };

    histList.push(newHistoryEntry);
    this.configs.set(id, rollbacked);
    return rollbacked;
  }

  /**
   * Get version history entries for an application
   */
  public getVersionHistory(id: string): VersionHistoryEntry[] {
    const list = this.history.get(id) ?? [];
    return list.map((h) => ({ ...h, snapshot: { ...h.snapshot } }));
  }
}
