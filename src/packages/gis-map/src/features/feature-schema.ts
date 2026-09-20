/**
 * GeoSphere Platform — Dynamic Feature Schema & Attribute Validator
 *
 * Allows applications to define dynamic attribute schemas for any business model
 * (Field Force, Fleet, Logistics, Agriculture, Utilities, Government, etc.) without hardcoded fields.
 */

import { UniversalGeometryType } from "../editing/geospatial-editing-engine";

export type FieldDataType = "string" | "number" | "boolean" | "enum" | "date";

export interface GeoSphereFieldDefinition {
  name: string;
  label: string;
  type: FieldDataType;
  required?: boolean;
  options?: string[]; // For enum
  defaultValue?: any;
  description?: string;
}

export interface GeoSphereFeatureSchema {
  schemaId: string;
  schemaName: string;
  allowedGeometryTypes?: UniversalGeometryType[];
  fields: GeoSphereFieldDefinition[];
}

export interface SchemaValidationError {
  field: string;
  message: string;
}

export class GeoSphereSchemaValidator {
  public static validate(
    properties: Record<string, any>,
    schema: GeoSphereFeatureSchema
  ): SchemaValidationError[] {
    const errors: SchemaValidationError[] = [];

    schema.fields.forEach((field) => {
      const val = properties[field.name];

      if (field.required && (val === undefined || val === null || val === "")) {
        errors.push({ field: field.name, message: `Field "${field.label}" is required.` });
        return;
      }

      if (val !== undefined && val !== null && val !== "") {
        if (field.type === "number" && typeof val !== "number" && isNaN(Number(val))) {
          errors.push({ field: field.name, message: `Field "${field.label}" must be a valid number.` });
        } else if (field.type === "boolean" && typeof val !== "boolean") {
          errors.push({ field: field.name, message: `Field "${field.label}" must be true or false.` });
        } else if (field.type === "enum" && field.options && !field.options.includes(val)) {
          errors.push({
            field: field.name,
            message: `Field "${field.label}" must be one of: ${field.options.join(", ")}.`,
          });
        }
      }
    });

    return errors;
  }
}
