/**
 * GeoSphere Dynamic Forms & Data Collection SDK Core Contracts
 * Framework-Neutral Versioned Schema, Field Dependencies, Validation, Drafts & Submission Engine
 */

export type GeoSphereFormFieldType =
  | "TEXT"
  | "TEXT_AREA"
  | "NUMBER"
  | "DECIMAL"
  | "INTEGER"
  | "BOOLEAN"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "EMAIL"
  | "PHONE"
  | "URL"
  | "PASSWORD"
  | "RATING"
  | "SLIDER"
  | "CHECKBOX"
  | "RADIO"
  | "DROPDOWN"
  | "FILE"
  | "IMAGE"
  | "SIGNATURE"
  | "LOCATION"
  | "ADDRESS"
  | "READ_ONLY"
  | "CALCULATED"
  | "CUSTOM";

export type GeoSphereFormStatus =
  | "INITIAL"
  | "LOADING"
  | "READY"
  | "DIRTY"
  | "VALIDATING"
  | "VALID"
  | "INVALID"
  | "SUBMITTING"
  | "SUBMITTED"
  | "SAVING_DRAFT"
  | "ERROR";

export interface GeoSphereFormValidationRule {
  type: "required" | "minLength" | "maxLength" | "min" | "max" | "pattern" | "email" | "phone" | "url" | "dateRange";
  value?: unknown;
  message?: string;
}

export interface GeoSphereFormCondition {
  fieldId: string;
  operator: "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "lessThan" | "greaterThanOrEqual" | "lessThanOrEqual" | "isEmpty" | "isNotEmpty";
  value?: unknown;
}

export interface GeoSphereFormDependency {
  conditions: GeoSphereFormCondition[];
  logicalOperator?: "AND" | "OR";
  action: "SHOW" | "HIDE" | "ENABLE" | "DISABLE" | "REQUIRE";
}

export interface GeoSphereFormCalculation {
  targetFieldId: string;
  expression: {
    operator: "MULTIPLY" | "ADD" | "SUBTRACT" | "DIVIDE";
    operandFields: string[];
  };
}

export interface GeoSphereFormFieldOption {
  label: string;
  value: string | number;
}

export interface GeoSphereFormField {
  id: string;
  type: GeoSphereFormFieldType;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  readOnly?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  validation?: GeoSphereFormValidationRule[];
  options?: GeoSphereFormFieldOption[];
  dependencies?: GeoSphereFormDependency[];
  metadata?: Record<string, unknown>;
}

export interface GeoSphereFormSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  fields: GeoSphereFormField[];
}

export interface GeoSphereFormSchema {
  formId: string;
  version: string;
  title: string;
  description?: string;
  sections: GeoSphereFormSection[];
  calculations?: GeoSphereFormCalculation[];
  metadata?: Record<string, unknown>;
}

export interface GeoSphereFormAttachment {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  url?: string;
}

export interface GeoSphereFormSignature {
  signatureId: string;
  dataUrl: string;
  createdAt: string;
}

export interface GeoSphereFormDraft {
  draftId: string;
  formId: string;
  formVersion: string;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface GeoSphereFormSubmission {
  submissionId: string;
  formId: string;
  formVersion: string;
  data: Record<string, unknown>;
  attachments?: GeoSphereFormAttachment[];
  signatures?: GeoSphereFormSignature[];
  submittedAt: string;
  idempotencyKey?: string;
}

export type GeoSphereFormCapability =
  | "SCHEMA_LOADING"
  | "DYNAMIC_RENDERING"
  | "FIELD_DEPENDENCIES"
  | "VALIDATION"
  | "DRAFT_AUTOSAVE"
  | "OFFLINE_SYNC"
  | "IDEMPOTENT_SUBMISSION"
  | "ATTACHMENT_MANAGEMENT"
  | "SIGNATURE_CAPTURE"
  | "CALCULATED_FIELDS";

export interface GeoSphereFormProviderInfo {
  name: string;
  version: string;
}

export interface GeoSphereFormProvider {
  getProviderInfo(): GeoSphereFormProviderInfo;
  getCapabilities(): GeoSphereFormCapability[];
  getFormSchema(formId: string): Promise<GeoSphereFormSchema>;
  saveDraft(draft: GeoSphereFormDraft): Promise<GeoSphereFormDraft>;
  loadDraft(formId: string): Promise<GeoSphereFormDraft | null>;
  deleteDraft(draftId: string): Promise<void>;
  submitForm(submission: GeoSphereFormSubmission): Promise<GeoSphereFormSubmission>;
}

export class GeoSphereFormsError extends Error {
  constructor(
    public readonly code:
      | "SCHEMA_INVALID"
      | "VALIDATION_FAILED"
      | "DRAFT_NOT_FOUND"
      | "SUBMISSION_FAILED"
      | "CIRCULAR_DEPENDENCY"
      | "MAX_NESTING_EXCEEDED"
      | "UNSUPPORTED_CAPABILITY"
      | "UNKNOWN_ERROR",
    message: string,
    public readonly details?: unknown
  ) {
    super(`[FORMS_ERROR:${code}] ${message}`);
    this.name = "GeoSphereFormsError";
  }
}

export class GeoSphereMockFormProvider implements GeoSphereFormProvider {
  private schemas = new Map<string, GeoSphereFormSchema>();
  private drafts = new Map<string, GeoSphereFormDraft>();
  private submissions = new Map<string, GeoSphereFormSubmission>();

  constructor() {
    const seedSchema: GeoSphereFormSchema = {
      formId: "form_seed_001",
      version: "1.0",
      title: "Generic Asset Data Collection Form",
      description: "Standard data collection schema.",
      sections: [
        {
          id: "sec_general",
          title: "General Information",
          order: 1,
          fields: [
            { id: "asset_name", type: "TEXT", label: "Asset Name", required: true },
            { id: "category", type: "SINGLE_SELECT", label: "Category", options: [{ label: "Equipment", value: "equip" }, { label: "Vehicle", value: "veh" }] },
            { id: "serial_no", type: "TEXT", label: "Serial Number", dependencies: [{ conditions: [{ fieldId: "category", operator: "equals", value: "equip" }], action: "SHOW" }] },
            { id: "quantity", type: "NUMBER", label: "Quantity", defaultValue: 1 },
            { id: "unit_price", type: "NUMBER", label: "Unit Price", defaultValue: 100 },
            { id: "total_cost", type: "CALCULATED", label: "Total Cost", readOnly: true }
          ]
        }
      ],
      calculations: [
        {
          targetFieldId: "total_cost",
          expression: { operator: "MULTIPLY", operandFields: ["quantity", "unit_price"] }
        }
      ]
    };
    this.schemas.set(seedSchema.formId, seedSchema);
  }

  public getProviderInfo(): GeoSphereFormProviderInfo {
    return { name: "GeoSphereMockFormProvider", version: "1.0.0" };
  }

  public getCapabilities(): GeoSphereFormCapability[] {
    return [
      "SCHEMA_LOADING",
      "DYNAMIC_RENDERING",
      "FIELD_DEPENDENCIES",
      "VALIDATION",
      "DRAFT_AUTOSAVE",
      "OFFLINE_SYNC",
      "IDEMPOTENT_SUBMISSION",
      "ATTACHMENT_MANAGEMENT",
      "SIGNATURE_CAPTURE",
      "CALCULATED_FIELDS"
    ];
  }

  public async getFormSchema(formId: string): Promise<GeoSphereFormSchema> {
    const schema = this.schemas.get(formId);
    if (!schema) {
      throw new GeoSphereFormsError("SCHEMA_INVALID", `Form schema ID ${formId} not found.`);
    }
    return JSON.parse(JSON.stringify(schema));
  }

  public async saveDraft(draft: GeoSphereFormDraft): Promise<GeoSphereFormDraft> {
    this.drafts.set(draft.draftId, draft);
    return JSON.parse(JSON.stringify(draft));
  }

  public async loadDraft(formId: string): Promise<GeoSphereFormDraft | null> {
    for (const d of this.drafts.values()) {
      if (d.formId === formId) return JSON.parse(JSON.stringify(d));
    }
    return null;
  }

  public async deleteDraft(draftId: string): Promise<void> {
    this.drafts.delete(draftId);
  }

  public async submitForm(submission: GeoSphereFormSubmission): Promise<GeoSphereFormSubmission> {
    this.submissions.set(submission.submissionId, submission);
    return JSON.parse(JSON.stringify(submission));
  }
}

export interface GeoSphereFormsConfig {
  embeddedMode?: boolean;
  autosaveEnabled?: boolean;
  autosaveDebounceMs?: number;
}

export class GeoSphereFormsSDK {
  private provider: GeoSphereFormProvider;
  private currentSchema?: GeoSphereFormSchema;
  private formData: Record<string, unknown> = {};
  private formStatus: GeoSphereFormStatus = "INITIAL";
  private validationErrors: Map<string, string> = new Map();
  private listeners: Map<string, (event: { type: string; payload: unknown }) => void> = new Map();

  constructor(
    private config: GeoSphereFormsConfig = {},
    provider?: GeoSphereFormProvider
  ) {
    this.provider = provider || new GeoSphereMockFormProvider();
    this.config.autosaveDebounceMs = this.config.autosaveDebounceMs || 2000;
  }

  public async initialize(): Promise<void> {}

  public getProviderInfo(): GeoSphereFormProviderInfo {
    return this.provider.getProviderInfo();
  }

  public getCapabilities(): GeoSphereFormCapability[] {
    return this.provider.getCapabilities();
  }

  public hasCapability(capability: GeoSphereFormCapability): boolean {
    return this.getCapabilities().includes(capability);
  }

  public async loadSchema(formId: string): Promise<GeoSphereFormSchema> {
    this.formStatus = "LOADING";
    this.currentSchema = await this.provider.getFormSchema(formId);
    this.formData = {};
    this.validationErrors.clear();

    // Initialize default values
    this.currentSchema.sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (f.defaultValue !== undefined) {
          this.formData[f.id] = f.defaultValue;
        }
      });
    });

    this.evaluateCalculatedFields();
    this.formStatus = "READY";
    this.notifyListeners("forms.schemaLoaded", { schema: this.currentSchema });
    return this.currentSchema;
  }

  public getFormStatus(): GeoSphereFormStatus {
    return this.formStatus;
  }

  public getFormData(): Record<string, unknown> {
    return { ...this.formData };
  }

  public setFieldValue(fieldId: string, value: unknown): void {
    this.formData[fieldId] = value;
    this.formStatus = "DIRTY";
    this.evaluateCalculatedFields();
    this.notifyListeners("forms.fieldChanged", { fieldId, value });
  }

  public isFieldVisible(fieldId: string): boolean {
    if (!this.currentSchema) return true;
    let field: GeoSphereFormField | undefined;

    for (const sec of this.currentSchema.sections) {
      const found = sec.fields.find((f) => f.id === fieldId);
      if (found) {
        field = found;
        break;
      }
    }

    if (!field || !field.dependencies || field.dependencies.length === 0) return true;

    for (const dep of field.dependencies) {
      const match = this.evaluateDependency(dep);
      if (dep.action === "SHOW" && !match) return false;
      if (dep.action === "HIDE" && match) return false;
    }
    return true;
  }

  public validateForm(): boolean {
    this.formStatus = "VALIDATING";
    this.validationErrors.clear();

    if (!this.currentSchema) return true;

    this.currentSchema.sections.forEach((sec) => {
      sec.fields.forEach((f) => {
        if (!this.isFieldVisible(f.id)) return;

        const val = this.formData[f.id];
        if (f.required && (val === undefined || val === null || val === "")) {
          this.validationErrors.set(f.id, `${f.label} is required.`);
        }

        if (f.validation && val !== undefined && val !== null) {
          f.validation.forEach((rule) => {
            if (rule.type === "minLength" && typeof val === "string" && val.length < Number(rule.value)) {
              this.validationErrors.set(f.id, rule.message || `Minimum length is ${rule.value}`);
            }
          });
        }
      });
    });

    const isValid = this.validationErrors.size === 0;
    this.formStatus = isValid ? "VALID" : "INVALID";
    this.notifyListeners("forms.validated", { isValid, errors: Object.fromEntries(this.validationErrors) });
    return isValid;
  }

  public getValidationErrors(): Map<string, string> {
    return new Map(this.validationErrors);
  }

  public async saveDraft(formId: string): Promise<GeoSphereFormDraft> {
    this.formStatus = "SAVING_DRAFT";
    const draft: GeoSphereFormDraft = {
      draftId: `draft_${Date.now()}`,
      formId,
      formVersion: this.currentSchema?.version || "1.0",
      data: { ...this.formData },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = await this.provider.saveDraft(draft);
    this.formStatus = "READY";
    this.notifyListeners("forms.draftSaved", { draft: saved });
    return saved;
  }

  public async submitForm(formId: string): Promise<GeoSphereFormSubmission> {
    if (!this.validateForm()) {
      throw new GeoSphereFormsError("VALIDATION_FAILED", "Form validation failed before submission.");
    }

    this.formStatus = "SUBMITTING";
    const submission: GeoSphereFormSubmission = {
      submissionId: `sub_${Date.now()}`,
      formId,
      formVersion: this.currentSchema?.version || "1.0",
      data: { ...this.formData },
      submittedAt: new Date().toISOString(),
      idempotencyKey: `idem_${formId}_${Date.now()}`
    };

    const result = await this.provider.submitForm(submission);
    this.formStatus = "SUBMITTED";
    this.notifyListeners("forms.submitted", { submission: result });
    return result;
  }

  public subscribe(onEvent: (event: { type: string; payload: unknown }) => void): { id: string; unsubscribe: () => void } {
    const subId = `forms_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.listeners.set(subId, onEvent);
    return {
      id: subId,
      unsubscribe: () => {
        this.listeners.delete(subId);
      }
    };
  }

  public destroy(): void {
    this.listeners.clear();
    this.formData = {};
    this.validationErrors.clear();
  }

  private evaluateCalculatedFields(): void {
    if (!this.currentSchema || !this.currentSchema.calculations) return;

    this.currentSchema.calculations.forEach((calc) => {
      const { operator, operandFields } = calc.expression;
      const operands = operandFields.map((fId) => Number(this.formData[fId]) || 0);

      let result = 0;
      if (operator === "MULTIPLY") {
        result = operands.reduce((acc, curr) => acc * curr, 1);
      } else if (operator === "ADD") {
        result = operands.reduce((acc, curr) => acc + curr, 0);
      }

      this.formData[calc.targetFieldId] = result;
    });
  }

  private evaluateDependency(dep: GeoSphereFormDependency): boolean {
    const results = dep.conditions.map((cond) => {
      const val = this.formData[cond.fieldId];
      if (cond.operator === "equals") return val === cond.value;
      if (cond.operator === "notEquals") return val !== cond.value;
      if (cond.operator === "isNotEmpty") return val !== undefined && val !== null && val !== "";
      return true;
    });

    if (dep.logicalOperator === "OR") return results.some(Boolean);
    return results.every(Boolean);
  }

  private notifyListeners(type: string, payload: unknown): void {
    this.listeners.forEach((listener) => {
      try {
        listener({ type, payload });
      } catch (err) {
        console.error("[FORMS_LISTENER_ERROR] Listener error:", err);
      }
    });
  }
}
