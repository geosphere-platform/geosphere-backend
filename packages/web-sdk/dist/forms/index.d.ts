import { HTTPClient } from "../http/index.js";
import { DynamicForm, FormSubmission, APIResponse } from "../types/index.js";
import { GeoSphereFormsSDK, GeoSphereFormsConfig, GeoSphereFormProvider } from "../contracts/forms.contracts.js";
export declare class FormsModule {
    private http;
    constructor(http: HTTPClient);
    listForms(): Promise<APIResponse<DynamicForm[]>>;
    submitForm(formId: string, data: Record<string, unknown>): Promise<APIResponse<FormSubmission>>;
    createFormsSDK(config?: GeoSphereFormsConfig, provider?: GeoSphereFormProvider): GeoSphereFormsSDK;
}
export * from "../contracts/forms.contracts.js";
export * from "../contracts/forms-ui.contracts.js";
//# sourceMappingURL=index.d.ts.map