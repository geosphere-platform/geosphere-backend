/**
 * Framework-Independent Form Validator Engine
 *
 * Validates dynamic form submissions against FormSchema definitions.
 * Evaluates required fields, numeric bounds, string lengths, regex patterns, selection options, and coordinates.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, or vehicle PII.
 */

import {
  FormSchema,
  FormField,
  FormValidationResult,
  FormValidationError,
} from "../types/form.types";

export class FormValidator {
  /**
   * Validate submission values against a FormSchema
   */
  public validateSubmission(
    schema: FormSchema,
    values: Record<string, unknown>,
  ): FormValidationResult {
    const errors: FormValidationError[] = [];

    for (const field of schema.fields) {
      const val = values[field.id];
      const isMissing = val === undefined || val === null || val === "";

      // 1. Required Rule Check
      if (field.required || field.validation?.required) {
        if (isMissing) {
          errors.push({
            fieldId: field.id,
            fieldLabel: field.label,
            rule: "required",
            message: field.validation?.customErrorMessage ?? `'${field.label}' is required`,
          });
          continue; // Skip further validation if required field is missing
        }
      }

      if (isMissing) continue; // Skip optional empty fields

      // 2. Field Type Specific Validation
      this.validateField(field, val, errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateField(field: FormField, val: unknown, errors: FormValidationError[]): void {
    const v = field.validation;

    if (field.type === "text" || field.type === "signature") {
      if (typeof val !== "string") {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "type", message: `'${field.label}' must be a string` });
        return;
      }
      if (v?.minLength !== undefined && val.length < v.minLength) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "minLength", message: v.customErrorMessage ?? `'${field.label}' must be at least ${v.minLength} characters` });
      }
      if (v?.maxLength !== undefined && val.length > v.maxLength) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "maxLength", message: v.customErrorMessage ?? `'${field.label}' cannot exceed ${v.maxLength} characters` });
      }
      if (v?.pattern) {
        const regex = new RegExp(v.pattern);
        if (!regex.test(val)) {
          errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "pattern", message: v.customErrorMessage ?? `'${field.label}' format is invalid` });
        }
      }
    }

    if (field.type === "number") {
      const numVal = Number(val);
      if (isNaN(numVal)) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "type", message: `'${field.label}' must be a valid number` });
        return;
      }
      if (v?.min !== undefined && numVal < v.min) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "min", message: v.customErrorMessage ?? `'${field.label}' must be at least ${v.min}` });
      }
      if (v?.max !== undefined && numVal > v.max) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "max", message: v.customErrorMessage ?? `'${field.label}' cannot exceed ${v.max}` });
      }
    }

    if (field.type === "select") {
      const validOptions = (field.options ?? []).map((o) => o.value);
      if (validOptions.length > 0 && !validOptions.includes(String(val))) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "options", message: `'${field.label}' must be one of: ${validOptions.join(", ")}` });
      }
    }

    if (field.type === "multiselect") {
      if (!Array.isArray(val)) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "type", message: `'${field.label}' must be an array of selected options` });
        return;
      }
      const validOptions = (field.options ?? []).map((o) => o.value);
      for (const item of val) {
        if (validOptions.length > 0 && !validOptions.includes(String(item))) {
          errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "options", message: `'${item}' is not a valid option for '${field.label}'` });
        }
      }
    }

    if (field.type === "coordinate") {
      if (!Array.isArray(val) || val.length < 2 || typeof val[0] !== "number" || typeof val[1] !== "number" || isNaN(val[0]) || isNaN(val[1])) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "type", message: `'${field.label}' must be a coordinate array [longitude, latitude]` });
        return;
      }
      const [lng, lat] = val as [number, number];
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        errors.push({ fieldId: field.id, fieldLabel: field.label, rule: "bounds", message: `'${field.label}' coordinate out of valid geographic range` });
      }
    }
  }
}
