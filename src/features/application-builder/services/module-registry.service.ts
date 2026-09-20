/**
 * Business Module Registry & Dependency Solver Service
 */

import { INITIAL_BUSINESS_MODULES } from "@/database/seed-application-builder";
import { ValidationIssue } from "../types/application.types";

export interface ModuleDefinition {
  code: string;
  name: string;
  description: string;
  version: string;
  dependencies: string[];
  features: string[];
  permissions: string[];
  status:
    "AVAILABLE" | "ENABLED" | "DISABLED" | "REQUIRED" | "OPTIONAL" | "PREMIUM";
}

export class ModuleRegistryService {
  private modulesMap: Map<string, ModuleDefinition>;

  constructor() {
    this.modulesMap = new Map();
    INITIAL_BUSINESS_MODULES.forEach((m) => {
      this.modulesMap.set(m.code, m as ModuleDefinition);
    });
  }

  public getAllModules(): ModuleDefinition[] {
    return Array.from(this.modulesMap.values());
  }

  public getModule(code: string): ModuleDefinition | undefined {
    return this.modulesMap.get(code);
  }

  /**
   * Validates if enabled modules meet dependency requirements.
   */
  public validateDependencies(enabledModuleCodes: string[]): ValidationIssue[] {
    const enabledSet = new Set(enabledModuleCodes);
    const issues: ValidationIssue[] = [];

    // Check mandatory modules
    this.modulesMap.forEach((mod) => {
      if (mod.status === "REQUIRED" && !enabledSet.has(mod.code)) {
        issues.push({
          code: "REQUIRED_MODULE_MISSING",
          message: `Mandatory module '${mod.name}' (${mod.code}) is disabled`,
          severity: "ERROR",
          module: mod.code,
        });
      }
    });

    // Check dependency satisfaction for enabled modules
    for (const code of enabledModuleCodes) {
      const def = this.modulesMap.get(code);
      if (!def) {
        issues.push({
          code: "UNKNOWN_MODULE",
          message: `Module '${code}' is not recognized in the registry`,
          severity: "ERROR",
          module: code,
        });
        continue;
      }

      for (const depCode of def.dependencies) {
        if (!enabledSet.has(depCode)) {
          const depDef = this.modulesMap.get(depCode);
          const depName = depDef ? depDef.name : depCode;
          issues.push({
            code: "MISSING_DEPENDENCY",
            message: `Module '${def.name}' (${code}) requires module '${depName}' (${depCode}), which is currently disabled`,
            severity: "ERROR",
            module: code,
          });
        }
      }
    }

    return issues;
  }
}

export const moduleRegistryService = new ModuleRegistryService();
