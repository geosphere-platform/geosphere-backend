/**
 * Framework-Independent ConfigValidator & Sandboxing Security Guard
 *
 * Validates ApplicationConfig schema structures and enforces strict security sandboxing
 * to disallow script injection, SQL keywords, and malicious HTML/JS payloads.
 */

import { ApplicationConfig, SandboxingGuardResult, BuilderError } from "../types/builder.types";

export class ConfigValidator {
  /**
   * Enforces security sandboxing to prevent executable JS / SQL injection in JSON customer configs
   */
  public runSandboxingGuard(config: ApplicationConfig): SandboxingGuardResult {
    const violations: string[] = [];
    const jsonStr = JSON.stringify(config).toLowerCase();

    // Executable JS & HTML XSS Injection patterns
    const DisallowedScriptPatterns = [
      "<script",
      "</script",
      "javascript:",
      "eval(",
      "onload=",
      "onerror=",
      "document.cookie",
      "window.location",
    ];

    for (const pattern of DisallowedScriptPatterns) {
      if (jsonStr.includes(pattern)) {
        violations.push(`Forbidden executable script pattern detected: '${pattern}'`);
      }
    }

    // SQL Injection patterns
    const DisallowedSqlPatterns = [
      "drop table",
      "drop database",
      "truncate table",
      "union select",
      "or 1=1",
      ";--",
    ];

    for (const sqlPattern of DisallowedSqlPatterns) {
      if (jsonStr.includes(sqlPattern)) {
        violations.push(`Forbidden SQL injection pattern detected: '${sqlPattern}'`);
      }
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }

  /**
   * Validate ApplicationConfig structural integrity
   */
  public validateConfig(config: ApplicationConfig): void {
    if (!config || !config.id || !config.tenantId || !config.name) {
      throw new BuilderError("INVALID_CONFIGURATION", "ApplicationConfig must specify id, tenantId, and name");
    }

    if (!config.modules || !Array.isArray(config.modules.enabledEngines) || config.modules.enabledEngines.length === 0) {
      throw new BuilderError("INVALID_CONFIGURATION", "ApplicationConfig must specify at least 1 enabled engine module");
    }

    const sandboxRes = this.runSandboxingGuard(config);
    if (!sandboxRes.valid) {
      throw new BuilderError(
        "SANDBOX_VIOLATION",
        `Configuration security sandboxing failed: ${sandboxRes.violations.join("; ")}`,
        { violations: sandboxRes.violations },
      );
    }
  }
}
