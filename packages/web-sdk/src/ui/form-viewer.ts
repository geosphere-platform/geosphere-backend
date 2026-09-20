/**
 * GeoSphere Web SDK — Embedded Dynamic Form Viewer Controller & UI
 */

export interface SDKFormField {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "checkbox" | "photo";
  required: boolean;
  options?: string[];
}

export interface SDKFormSchema {
  id: string;
  title: string;
  version: string;
  fields: SDKFormField[];
}

export class GeoSphereFormViewerController {
  private schema: SDKFormSchema;

  constructor(schema: SDKFormSchema) {
    this.schema = schema;
  }

  public validateSubmission(data: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    for (const field of this.schema.fields) {
      if (field.required && (data[field.id] === undefined || data[field.id] === null || data[field.id] === "")) {
        errors.push(`Field '${field.label}' is required`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  public renderHTML(): string {
    return `<div class="geosphere-form-viewer" style="background: #0f172a; border: 1px solid rgba(99,102,241,0.3); border-radius: 10px; padding: 1.25rem; color: #f1f5f9;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-b: 1px solid #1e293b; padding-bottom: 0.5rem; margin-bottom: 1rem;">
        <h3 style="font-size: 0.875rem; font-weight: 700; color: #f1f5f9; margin: 0;">${this.schema.title}</h3>
        <span style="font-size: 0.65rem; font-family: monospace; padding: 2px 6px; background: rgba(16,185,129,0.2); color: #10b981; border-radius: 4px;">${this.schema.version}</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${this.schema.fields
          .map(
            (f) => `
          <div>
            <label style="font-size: 0.75rem; font-family: monospace; color: #94a3b8; display: block; margin-bottom: 0.25rem;">${f.label} ${f.required ? '<span style="color:#ef4444;">*</span>' : ""}</label>
            <input type="${f.type === "number" ? "number" : "text"}" placeholder="Enter ${f.label.toLowerCase()}..." style="width: 100%; padding: 0.5rem; background: #020617; border: 1px solid #1e293b; border-radius: 6px; color: #f1f5f9; font-size: 0.75rem;" />
          </div>`
          )
          .join("")}
      </div>
    </div>`;
  }
}
