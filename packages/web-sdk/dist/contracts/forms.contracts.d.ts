/**
 * GeoSphere Dynamic Forms & Data Collection SDK Core Contracts
 * Framework-Neutral Versioned Schema, Field Dependencies, Validation, Drafts & Submission Engine
 */
export type GeoSphereFormFieldType = "TEXT" | "TEXT_AREA" | "NUMBER" | "DECIMAL" | "INTEGER" | "BOOLEAN" | "SINGLE_SELECT" | "MULTI_SELECT" | "DATE" | "TIME" | "DATETIME" | "EMAIL" | "PHONE" | "URL" | "PASSWORD" | "RATING" | "SLIDER" | "CHECKBOX" | "RADIO" | "DROPDOWN" | "FILE" | "IMAGE" | "SIGNATURE" | "LOCATION" | "ADDRESS" | "READ_ONLY" | "CALCULATED" | "CUSTOM";
export type GeoSphereFormStatus = "INITIAL" | "LOADING" | "READY" | "DIRTY" | "VALIDATING" | "VALID" | "INVALID" | "SUBMITTING" | "SUBMITTED" | "SAVING_DRAFT" | "ERROR";
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
export type GeoSphereFormCapability = "SCHEMA_LOADING" | "DYNAMIC_RENDERING" | "FIELD_DEPENDENCIES" | "VALIDATION" | "DRAFT_AUTOSAVE" | "OFFLINE_SYNC" | "IDEMPOTENT_SUBMISSION" | "ATTACHMENT_MANAGEMENT" | "SIGNATURE_CAPTURE" | "CALCULATED_FIELDS";
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
export declare class GeoSphereFormsError extends Error {
    readonly code: "SCHEMA_INVALID" | "VALIDATION_FAILED" | "DRAFT_NOT_FOUND" | "SUBMISSION_FAILED" | "CIRCULAR_DEPENDENCY" | "MAX_NESTING_EXCEEDED" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR";
    readonly details?: unknown | undefined;
    constructor(code: "SCHEMA_INVALID" | "VALIDATION_FAILED" | "DRAFT_NOT_FOUND" | "SUBMISSION_FAILED" | "CIRCULAR_DEPENDENCY" | "MAX_NESTING_EXCEEDED" | "UNSUPPORTED_CAPABILITY" | "UNKNOWN_ERROR", message: string, details?: unknown | undefined);
}
export declare class GeoSphereMockFormProvider implements GeoSphereFormProvider {
    private schemas;
    private drafts;
    private submissions;
    constructor();
    getProviderInfo(): GeoSphereFormProviderInfo;
    getCapabilities(): GeoSphereFormCapability[];
    getFormSchema(formId: string): Promise<GeoSphereFormSchema>;
    saveDraft(draft: GeoSphereFormDraft): Promise<GeoSphereFormDraft>;
    loadDraft(formId: string): Promise<GeoSphereFormDraft | null>;
    deleteDraft(draftId: string): Promise<void>;
    submitForm(submission: GeoSphereFormSubmission): Promise<GeoSphereFormSubmission>;
}
export interface GeoSphereFormsConfig {
    embeddedMode?: boolean;
    autosaveEnabled?: boolean;
    autosaveDebounceMs?: number;
}
export declare class GeoSphereFormsSDK {
    private config;
    private provider;
    private currentSchema?;
    private formData;
    private formStatus;
    private validationErrors;
    private listeners;
    constructor(config?: GeoSphereFormsConfig, provider?: GeoSphereFormProvider);
    initialize(): Promise<void>;
    getProviderInfo(): GeoSphereFormProviderInfo;
    getCapabilities(): GeoSphereFormCapability[];
    hasCapability(capability: GeoSphereFormCapability): boolean;
    loadSchema(formId: string): Promise<GeoSphereFormSchema>;
    getFormStatus(): GeoSphereFormStatus;
    getFormData(): Record<string, unknown>;
    setFieldValue(fieldId: string, value: unknown): void;
    isFieldVisible(fieldId: string): boolean;
    validateForm(): boolean;
    getValidationErrors(): Map<string, string>;
    saveDraft(formId: string): Promise<GeoSphereFormDraft>;
    submitForm(formId: string): Promise<GeoSphereFormSubmission>;
    subscribe(onEvent: (event: {
        type: string;
        payload: unknown;
    }) => void): {
        id: string;
        unsubscribe: () => void;
    };
    destroy(): void;
    private evaluateCalculatedFields;
    private evaluateDependency;
    private notifyListeners;
}
//# sourceMappingURL=forms.contracts.d.ts.map