/**
 * GeoSphere Dynamic Forms & Data Collection SDK Core Contracts
 * Framework-Neutral Versioned Schema, Field Dependencies, Validation, Drafts & Submission Engine
 */
export class GeoSphereFormsError extends Error {
    code;
    details;
    constructor(code, message, details) {
        super(`[FORMS_ERROR:${code}] ${message}`);
        this.code = code;
        this.details = details;
        this.name = "GeoSphereFormsError";
    }
}
export class GeoSphereMockFormProvider {
    schemas = new Map();
    drafts = new Map();
    submissions = new Map();
    constructor() {
        const seedSchema = {
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
    getProviderInfo() {
        return { name: "GeoSphereMockFormProvider", version: "1.0.0" };
    }
    getCapabilities() {
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
    async getFormSchema(formId) {
        const schema = this.schemas.get(formId);
        if (!schema) {
            throw new GeoSphereFormsError("SCHEMA_INVALID", `Form schema ID ${formId} not found.`);
        }
        return JSON.parse(JSON.stringify(schema));
    }
    async saveDraft(draft) {
        this.drafts.set(draft.draftId, draft);
        return JSON.parse(JSON.stringify(draft));
    }
    async loadDraft(formId) {
        for (const d of this.drafts.values()) {
            if (d.formId === formId)
                return JSON.parse(JSON.stringify(d));
        }
        return null;
    }
    async deleteDraft(draftId) {
        this.drafts.delete(draftId);
    }
    async submitForm(submission) {
        this.submissions.set(submission.submissionId, submission);
        return JSON.parse(JSON.stringify(submission));
    }
}
export class GeoSphereFormsSDK {
    config;
    provider;
    currentSchema;
    formData = {};
    formStatus = "INITIAL";
    validationErrors = new Map();
    listeners = new Map();
    constructor(config = {}, provider) {
        this.config = config;
        this.provider = provider || new GeoSphereMockFormProvider();
        this.config.autosaveDebounceMs = this.config.autosaveDebounceMs || 2000;
    }
    async initialize() { }
    getProviderInfo() {
        return this.provider.getProviderInfo();
    }
    getCapabilities() {
        return this.provider.getCapabilities();
    }
    hasCapability(capability) {
        return this.getCapabilities().includes(capability);
    }
    async loadSchema(formId) {
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
    getFormStatus() {
        return this.formStatus;
    }
    getFormData() {
        return { ...this.formData };
    }
    setFieldValue(fieldId, value) {
        this.formData[fieldId] = value;
        this.formStatus = "DIRTY";
        this.evaluateCalculatedFields();
        this.notifyListeners("forms.fieldChanged", { fieldId, value });
    }
    isFieldVisible(fieldId) {
        if (!this.currentSchema)
            return true;
        let field;
        for (const sec of this.currentSchema.sections) {
            const found = sec.fields.find((f) => f.id === fieldId);
            if (found) {
                field = found;
                break;
            }
        }
        if (!field || !field.dependencies || field.dependencies.length === 0)
            return true;
        for (const dep of field.dependencies) {
            const match = this.evaluateDependency(dep);
            if (dep.action === "SHOW" && !match)
                return false;
            if (dep.action === "HIDE" && match)
                return false;
        }
        return true;
    }
    validateForm() {
        this.formStatus = "VALIDATING";
        this.validationErrors.clear();
        if (!this.currentSchema)
            return true;
        this.currentSchema.sections.forEach((sec) => {
            sec.fields.forEach((f) => {
                if (!this.isFieldVisible(f.id))
                    return;
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
    getValidationErrors() {
        return new Map(this.validationErrors);
    }
    async saveDraft(formId) {
        this.formStatus = "SAVING_DRAFT";
        const draft = {
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
    async submitForm(formId) {
        if (!this.validateForm()) {
            throw new GeoSphereFormsError("VALIDATION_FAILED", "Form validation failed before submission.");
        }
        this.formStatus = "SUBMITTING";
        const submission = {
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
    subscribe(onEvent) {
        const subId = `forms_sub_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        this.listeners.set(subId, onEvent);
        return {
            id: subId,
            unsubscribe: () => {
                this.listeners.delete(subId);
            }
        };
    }
    destroy() {
        this.listeners.clear();
        this.formData = {};
        this.validationErrors.clear();
    }
    evaluateCalculatedFields() {
        if (!this.currentSchema || !this.currentSchema.calculations)
            return;
        this.currentSchema.calculations.forEach((calc) => {
            const { operator, operandFields } = calc.expression;
            const operands = operandFields.map((fId) => Number(this.formData[fId]) || 0);
            let result = 0;
            if (operator === "MULTIPLY") {
                result = operands.reduce((acc, curr) => acc * curr, 1);
            }
            else if (operator === "ADD") {
                result = operands.reduce((acc, curr) => acc + curr, 0);
            }
            this.formData[calc.targetFieldId] = result;
        });
    }
    evaluateDependency(dep) {
        const results = dep.conditions.map((cond) => {
            const val = this.formData[cond.fieldId];
            if (cond.operator === "equals")
                return val === cond.value;
            if (cond.operator === "notEquals")
                return val !== cond.value;
            if (cond.operator === "isNotEmpty")
                return val !== undefined && val !== null && val !== "";
            return true;
        });
        if (dep.logicalOperator === "OR")
            return results.some(Boolean);
        return results.every(Boolean);
    }
    notifyListeners(type, payload) {
        this.listeners.forEach((listener) => {
            try {
                listener({ type, payload });
            }
            catch (err) {
                console.error("[FORMS_LISTENER_ERROR] Listener error:", err);
            }
        });
    }
}
//# sourceMappingURL=forms.contracts.js.map