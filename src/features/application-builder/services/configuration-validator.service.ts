/**
 * Application Configuration Validator Engine
 */

import {
  ApplicationConfig,
  ValidationResult,
  ValidationIssue,
} from "../types/application.types";
import { moduleRegistryService } from "./module-registry.service";

export class ConfigurationValidatorService {
  /**
   * Performs full strict validation of an application configuration payload before publication.
   */
  public validate(config: ApplicationConfig): ValidationResult {
    const issues: ValidationIssue[] = [];

    // 1. Module & Dependency Validation
    if (
      !config.modules ||
      !Array.isArray(config.modules) ||
      config.modules.length === 0
    ) {
      issues.push({
        code: "EMPTY_MODULES",
        message:
          "Application must have at least one enabled module (MAP is required)",
        severity: "ERROR",
      });
    } else {
      const depIssues = moduleRegistryService.validateDependencies(
        config.modules,
      );
      issues.push(...depIssues);
    }

    // 2. Branding Validation
    if (
      !config.branding ||
      !config.branding.appTitle ||
      config.branding.appTitle.trim() === ""
    ) {
      issues.push({
        code: "INVALID_BRANDING",
        message:
          "Application title is required in white-label branding configuration",
        severity: "ERROR",
        field: "branding.appTitle",
      });
    }

    // 3. Map Configuration Validation
    if (!config.mapConfig) {
      issues.push({
        code: "MISSING_MAP_CONFIG",
        message: "Map configuration is required",
        severity: "ERROR",
      });
    } else {
      if (
        !config.mapConfig.initialCenter ||
        !Array.isArray(config.mapConfig.initialCenter) ||
        config.mapConfig.initialCenter.length !== 2
      ) {
        issues.push({
          code: "INVALID_MAP_CENTER",
          message:
            "Map initial center coordinates must be a valid [longitude, latitude] pair",
          severity: "ERROR",
          field: "mapConfig.initialCenter",
        });
      }
      if (
        config.mapConfig.zoom < config.mapConfig.minZoom ||
        config.mapConfig.zoom > config.mapConfig.maxZoom
      ) {
        issues.push({
          code: "INVALID_MAP_ZOOM",
          message: `Initial zoom (${config.mapConfig.zoom}) must be between minZoom (${config.mapConfig.minZoom}) and maxZoom (${config.mapConfig.maxZoom})`,
          severity: "ERROR",
          field: "mapConfig.zoom",
        });
      }
    }

    // 4. GIS Layer Validation
    if (config.layers && Array.isArray(config.layers)) {
      const layerIds = new Set<string>();
      for (const layer of config.layers) {
        if (!layer.id || layer.id.trim() === "") {
          issues.push({
            code: "INVALID_LAYER_ID",
            message: "GIS layer must have a non-empty ID",
            severity: "ERROR",
          });
        } else if (layerIds.has(layer.id)) {
          issues.push({
            code: "DUPLICATE_LAYER_ID",
            message: `Duplicate GIS layer ID detected: '${layer.id}'`,
            severity: "ERROR",
          });
        } else {
          layerIds.add(layer.id);
        }

        if (!layer.name || layer.name.trim() === "") {
          issues.push({
            code: "INVALID_LAYER_NAME",
            message: `GIS layer '${layer.id}' must have a descriptive name`,
            severity: "ERROR",
          });
        }
      }
    }

    // 5. Dynamic Form Validation
    if (config.forms && Array.isArray(config.forms)) {
      const formKeys = new Set<string>();
      for (const form of config.forms) {
        if (!form.formKey || form.formKey.trim() === "") {
          issues.push({
            code: "INVALID_FORM_KEY",
            message: "Form must have a valid formKey identifier",
            severity: "ERROR",
          });
        } else if (formKeys.has(form.formKey)) {
          issues.push({
            code: "DUPLICATE_FORM_KEY",
            message: `Duplicate form key detected: '${form.formKey}'`,
            severity: "ERROR",
          });
        } else {
          formKeys.add(form.formKey);
        }

        if (
          !form.fields ||
          !Array.isArray(form.fields) ||
          form.fields.length === 0
        ) {
          issues.push({
            code: "EMPTY_FORM_FIELDS",
            message: `Form '${form.formKey}' contains no fields`,
            severity: "WARNING",
          });
        }
      }
    }

    // 6. Workflow Validation
    if (config.workflows && Array.isArray(config.workflows)) {
      for (const wf of config.workflows) {
        if (!wf.code || wf.code.trim() === "") {
          issues.push({
            code: "INVALID_WORKFLOW_CODE",
            message: "Workflow must have a valid code identifier",
            severity: "ERROR",
          });
        }
        if (
          !wf.definition ||
          !wf.definition.states ||
          !Array.isArray(wf.definition.states) ||
          wf.definition.states.length === 0
        ) {
          issues.push({
            code: "INVALID_WORKFLOW_STATES",
            message: `Workflow '${wf.code}' must define at least one valid state`,
            severity: "ERROR",
          });
        } else {
          const stateSet = new Set(wf.definition.states);
          if (
            wf.definition.initialState &&
            !stateSet.has(wf.definition.initialState)
          ) {
            issues.push({
              code: "INVALID_INITIAL_STATE",
              message: `Workflow '${wf.code}' initial state '${wf.definition.initialState}' is not included in defined states`,
              severity: "ERROR",
            });
          }

          if (
            wf.definition.transitions &&
            Array.isArray(wf.definition.transitions)
          ) {
            for (const tr of wf.definition.transitions) {
              if (!stateSet.has(tr.from) || !stateSet.has(tr.to)) {
                issues.push({
                  code: "INVALID_TRANSITION_STATE",
                  message: `Workflow '${wf.code}' transition from '${tr.from}' to '${tr.to}' references undefined states`,
                  severity: "ERROR",
                });
              }
            }
          }
        }
      }
    }

    const hasErrors = issues.some((i) => i.severity === "ERROR");

    return {
      isValid: !hasErrors,
      issues,
    };
  }
}

export const configurationValidatorService =
  new ConfigurationValidatorService();
