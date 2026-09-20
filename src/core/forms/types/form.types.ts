/**
 * GeoSphere Core Forms & Field Data Engine — Framework-Independent Domain Models
 *
 * Defines pure TypeScript models for dynamic form schemas, form fields, field validation rules,
 * field values, submission payloads, and validation errors.
 *
 * MUST NOT depend on React, Next.js, OpenLayers, Android/iOS UI, database ORMs, or vehicle PII.
 */

import { Coordinate } from "../../gis/types/geometry";

export type FormFieldType =
  | "text"
  | "number"
  | "select"
  | "multiselect"
  | "coordinate"
  | "photo"
  | "signature"
  | "date"
  | "boolean";

export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regular expression string
  customErrorMessage?: string;
}

export interface FormField {
  id: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: FormFieldOption[]; // Used for select / multiselect
  validation?: FormFieldValidation;
  defaultValue?: unknown;
  spatialBinding?: {
    bindToCoordinate?: boolean;
    bindToGeofenceId?: boolean;
  };
  metadata?: Record<string, unknown>;
}

export interface FormSchema {
  id: string;
  name: string;
  version: number;
  description?: string;
  fields: FormField[];
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface FormFieldValue {
  fieldId: string;
  value: unknown; // string | number | boolean | Coordinate | string[] | photo metadata
}

export interface FormSubmission {
  id: string;
  schemaId: string;
  schemaVersion: number;
  submitterId: string; // Generic user, agent, employee, or device ID
  values: Record<string, unknown>; // Keyed by fieldId
  coordinate?: Coordinate; // Optional GPS capture location
  submittedAt: string; // ISO 8601 UTC
  metadata?: Record<string, unknown>;
}

export interface FormValidationError {
  fieldId: string;
  fieldLabel: string;
  rule: string;
  message: string;
}

export interface FormValidationResult {
  valid: boolean;
  errors: FormValidationError[];
}

export type FormSubmissionListener = (submission: FormSubmission) => void;
