import { GeoSphereFormsSDK } from "../contracts/forms.contracts.js";
export class FormsModule {
    http;
    constructor(http) {
        this.http = http;
    }
    async listForms() {
        return this.http.get("/api/forms");
    }
    async submitForm(formId, data) {
        return this.http.post(`/api/forms/${formId}/submissions`, { data });
    }
    createFormsSDK(config, provider) {
        return new GeoSphereFormsSDK(config, provider);
    }
}
export * from "../contracts/forms.contracts.js";
export * from "../contracts/forms-ui.contracts.js";
//# sourceMappingURL=index.js.map