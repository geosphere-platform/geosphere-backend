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
export declare class GeoSphereFormViewerController {
    private schema;
    constructor(schema: SDKFormSchema);
    validateSubmission(data: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
    renderHTML(): string;
}
//# sourceMappingURL=form-viewer.d.ts.map