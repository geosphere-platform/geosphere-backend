import { HTTPClient } from "../http/index.js";
import { DynamicForm, FormSubmission, APIResponse } from "../types/index.js";
import { GeoSphereFormsSDK, GeoSphereFormsConfig, GeoSphereFormProvider } from "../contracts/forms.contracts.js";

export class FormsModule {
  constructor(private http: HTTPClient) {}

  public async listForms(): Promise<APIResponse<DynamicForm[]>> {
    return this.http.get<DynamicForm[]>("/api/forms");
  }

  public async submitForm(formId: string, data: Record<string, unknown>): Promise<APIResponse<FormSubmission>> {
    return this.http.post<FormSubmission>(`/api/forms/${formId}/submissions`, { data });
  }

  public createFormsSDK(
    config?: GeoSphereFormsConfig,
    provider?: GeoSphereFormProvider
  ): GeoSphereFormsSDK {
    return new GeoSphereFormsSDK(config, provider);
  }
}

export * from "../contracts/forms.contracts.js";
export * from "../contracts/forms-ui.contracts.js";
