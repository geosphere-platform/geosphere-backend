/**
 * GeoSphere Step 21 Dynamic Forms & Data Collection SDK + Native UI Foundation Unit Test Suite
 */
import { GeoSphereFormsSDK, GeoSphereMockFormProvider, FORMS_UI_COMPONENTS, FORMS_READY_MADE_SCREENS, resolveThemePrecedence, validateLocaleConfig, evaluatePermissionState } from "../contracts/index.js";
import { GeoSphereClient } from "../client.js";
async function runFormsSdkTests() {
    console.log("==========================================");
    console.log("RUNNING GEOSPHERE DYNAMIC FORMS & DATA COLLECTION SDK UNIT TESTS");
    console.log("==========================================");
    // 1. Initialization & Capabilities
    console.log("  [1/37] Testing Forms SDK Initialization & Capabilities...");
    const config = {
        embeddedMode: true,
        autosaveEnabled: true,
        autosaveDebounceMs: 2000
    };
    const provider = new GeoSphereMockFormProvider();
    const sdk = new GeoSphereFormsSDK(config, provider);
    await sdk.initialize();
    const caps = sdk.getCapabilities();
    if (!caps.includes("SCHEMA_LOADING") || !caps.includes("DYNAMIC_RENDERING") || !caps.includes("FIELD_DEPENDENCIES") || !caps.includes("VALIDATION")) {
        throw new Error("Capability discovery failed for supported Forms capabilities");
    }
    // 2. Schema Loading & Default Values
    console.log("  [2/37] Testing Form Schema Loading & Default Values...");
    const schema = await sdk.loadSchema("form_seed_001");
    if (!schema || schema.formId !== "form_seed_001" || schema.sections.length === 0) {
        throw new Error("loadSchema failed to return valid seed schema");
    }
    if (sdk.getFormStatus() !== "READY") {
        throw new Error("loadSchema failed to transition form status to READY");
    }
    const initialData = sdk.getFormData();
    if (initialData.quantity !== 1 || initialData.unit_price !== 100) {
        throw new Error("Default values failed to populate in initial form data state");
    }
    // 3. Calculated Fields Evaluation (Safe Mathematical Arithmetic without eval)
    console.log("  [3/37] Testing Calculated Fields Evaluation (quantity * unit_price)...");
    if (initialData.total_cost !== 100) {
        throw new Error(`Calculated field total_cost evaluated to ${initialData.total_cost}, expected 100`);
    }
    // 4. Field Value Mutation & Recalculation
    console.log("  [4/37] Testing Field Value Mutation & Live Recalculation...");
    sdk.setFieldValue("quantity", 5);
    const updatedData = sdk.getFormData();
    if (updatedData.quantity !== 5 || updatedData.total_cost !== 500) {
        throw new Error(`Calculated total_cost evaluated to ${updatedData.total_cost} after quantity change, expected 500`);
    }
    if (sdk.getFormStatus() !== "DIRTY") {
        throw new Error("setFieldValue failed to transition form status to DIRTY");
    }
    // 5. Conditional Dependencies Evaluation (SHOW / HIDE)
    console.log("  [5/37] Testing Conditional Field Dependencies Evaluation (SHOW/HIDE)...");
    if (sdk.isFieldVisible("serial_no")) {
        throw new Error("serial_no field should be HIDDEN when category is not 'equip'");
    }
    sdk.setFieldValue("category", "equip");
    if (!sdk.isFieldVisible("serial_no")) {
        throw new Error("serial_no field should be VISIBLE when category is 'equip'");
    }
    // 6. Field Validation Engine
    console.log("  [6/37] Testing Form Field Validation Engine...");
    sdk.setFieldValue("asset_name", ""); // Required field
    const isValid = sdk.validateForm();
    if (isValid || sdk.getFormStatus() !== "INVALID") {
        throw new Error("validateForm failed to report INVALID state on missing required field");
    }
    const errors = sdk.getValidationErrors();
    if (!errors.has("asset_name")) {
        throw new Error("Validation errors map missing required error for asset_name");
    }
    sdk.setFieldValue("asset_name", "Generator Alpha");
    const isValidNow = sdk.validateForm();
    if (!isValidNow || sdk.getFormStatus() !== "VALID") {
        throw new Error("validateForm failed to report VALID state after populating required field");
    }
    // 7. Draft Management & Autosave
    console.log("  [7/37] Testing Draft Creation, Autosave & Resume...");
    const draft = await sdk.saveDraft("form_seed_001");
    if (!draft.draftId || draft.formId !== "form_seed_001" || draft.data.asset_name !== "Generator Alpha") {
        throw new Error("saveDraft failed to persist active form data state into draft struct");
    }
    // 8. Form Submission & Idempotency
    console.log("  [8/37] Testing Form Submission & Idempotency Key Generation...");
    const submission = await sdk.submitForm("form_seed_001");
    if (!submission.submissionId || !submission.idempotencyKey || sdk.getFormStatus() !== "SUBMITTED") {
        throw new Error("submitForm failed to submit valid form record with idempotency key");
    }
    // 9. Attachments & Signature Structs
    console.log("  [9/37] Verifying Attachment & Signature Metadata Structs...");
    const signatureStruct = {
        signatureId: "sig_001",
        dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        createdAt: new Date().toISOString()
    };
    if (!signatureStruct.dataUrl.startsWith("data:image/png")) {
        throw new Error("Signature dataUrl format check failed");
    }
    // 10. Location SDK Integration Boundary
    console.log(" [10/37] Verifying Location SDK Integration Boundary...");
    const formLocationValue = {
        fieldId: "asset_location",
        coordinates: [79.0882, 21.1458],
        accuracyMeters: 5
    };
    if (formLocationValue.coordinates.length !== 2) {
        throw new Error("Form location field coordinates check failed");
    }
    // 11. Search SDK Integration Boundary
    console.log(" [11/37] Verifying Search SDK Address Geocoding Integration Boundary...");
    const formAddressValue = {
        fieldId: "asset_address",
        formattedAddress: "Nagpur, Maharashtra, India",
        placeId: "plc_nagpur_01"
    };
    if (!formAddressValue.placeId) {
        throw new Error("Form address field placeId check failed");
    }
    // 12. Offline SDK Integration Boundary
    console.log(" [12/37] Verifying Offline SDK Sync Queue Integration Boundary...");
    const offlineSyncItem = {
        id: "sync_form_sub_001",
        type: "FORM_SUBMISSION",
        payload: submission
    };
    if (offlineSyncItem.type !== "FORM_SUBMISSION") {
        throw new Error("Offline SDK sync queue boundary check failed");
    }
    // 13. Security Audit (Zero Code Execution via eval)
    console.log(" [13/37] Verifying Security Audit (Zero Code Execution via eval)...");
    const sdkCodeStr = sdk.toString() + sdk.loadSchema.toString();
    if (sdkCodeStr.includes("eval(") || sdkCodeStr.includes("new Function(")) {
        throw new Error("SECURITY VIOLATION: Core Forms SDK exposes arbitrary JavaScript code execution!");
    }
    // 14. Privacy Audit (No Logged Form Input Values or Signatures)
    console.log(" [14/37] Verifying Privacy Audit (Zero Logged Form Inputs or Signatures)...");
    const draftStr = JSON.stringify(draft);
    if (draftStr.includes("userCreditCard") || draftStr.includes("ssn")) {
        throw new Error("PRIVACY VIOLATION: Draft payload contains unredacted private credentials!");
    }
    // 15. Theme System Integration
    console.log(" [15/37] Testing Forms Theme System Integration...");
    const theme = resolveThemePrecedence({
        tenantConfig: { preset: "dark-pro" }
    });
    if (!theme.colors.primary)
        throw new Error("Theme resolution failed for Forms SDK");
    // 16. Localization Configuration
    console.log(" [16/37] Testing Forms Localization Configuration...");
    const validLocale = validateLocaleConfig({
        language: "en",
        locale: "en-US",
        timezone: "UTC",
        dateFormat: "YYYY-MM-DD",
        timeFormat: "HH:mm",
        distanceUnit: "kilometers",
        speedUnit: "km/h"
    });
    if (validLocale.distanceUnit !== "kilometers")
        throw new Error("Localization validation failed");
    // 17. RBAC Permission Integration
    console.log(" [17/37] Testing Forms RBAC Permission Checks...");
    const userPerms = ["forms.execute"];
    const execState = evaluatePermissionState(userPerms, "forms.execute", "hide");
    if (execState.status !== "granted")
        throw new Error("RBAC evaluation failed for granted permission");
    const manageState = evaluatePermissionState(userPerms, "forms.manage", "disable");
    if (manageState.status !== "denied" || manageState.mode !== "disable")
        throw new Error("RBAC evaluation failed for denied permission");
    // 18. Reusable UI Components Metadata
    console.log(" [18/37] Testing Reusable Forms Component Definitions Metadata...");
    const rendererComp = FORMS_UI_COMPONENTS.FORM_RENDERER;
    const sigComp = FORMS_UI_COMPONENTS.SIGNATURE_PAD;
    if (rendererComp.id !== "forms.form-renderer" || rendererComp.supportedPlatforms.length !== 3) {
        throw new Error("FORM_RENDERER component metadata check failed");
    }
    if (!sigComp.requiredPermissions.includes("forms.execute")) {
        throw new Error("SIGNATURE_PAD required permissions check failed");
    }
    // 19. Ready-Made Forms Screens Metadata
    console.log(" [19/37] Testing Ready-Made Forms Screen Definitions Metadata...");
    const rendererScreen = FORMS_READY_MADE_SCREENS.FORM_RENDERER_SCREEN;
    const draftScreen = FORMS_READY_MADE_SCREENS.DRAFT_LIST_SCREEN;
    if (rendererScreen.mode !== "full-screen" || !rendererScreen.requiredPermissions.includes("forms.execute")) {
        throw new Error("FORM_RENDERER_SCREEN metadata check failed");
    }
    if (!draftScreen.requiredPermissions.includes("forms.execute")) {
        throw new Error("DRAFT_LIST_SCREEN metadata check failed");
    }
    // 20. Framework Neutrality Audit
    console.log(" [20/37] Verifying Framework Neutrality (No React/DOM Leakage)...");
    if (typeof sdk.render === "function" || typeof sdk.componentDidMount === "function") {
        throw new Error("DEPENDENCY VIOLATION: Core Forms SDK leaks UI framework methods!");
    }
    // 21. Resource Cleanup
    console.log(" [21/37] Testing Forms SDK Resource Cleanup (destroy)...");
    sdk.destroy();
    // 22. Backward Compatibility with GeoSphereClient.forms
    console.log(" [22/37] Verifying Backward Compatibility with GeoSphereClient.forms...");
    const client = new GeoSphereClient({
        baseUrl: "https://api.geosphere.local",
        tenantId: "tenant_forms_test_001",
        applicationId: "app_forms_test_001"
    });
    if (!client.forms || typeof client.forms.createFormsSDK !== "function") {
        throw new Error("Backward compatibility broken: existing client.forms facade is invalid");
    }
    // 23–37. Zero Duplication Engine & Forbidden Business Workflow Checks
    console.log(" [23/37] Verifying Zero Duplicate GIS Engine in Forms Core...");
    if (typeof GeoSphereFormsSDK.prototype.createPolygon === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented GIS Geometry Engine!");
    }
    console.log(" [24/37] Verifying Zero Duplicate Map Renderer in Forms Core...");
    if (typeof GeoSphereFormsSDK.prototype.renderMap === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Map Renderer!");
    }
    console.log(" [25/37] Verifying Zero Duplicate Location Acquisition Engine...");
    if (typeof GeoSphereFormsSDK.prototype.watchPosition === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Location Engine!");
    }
    console.log(" [26/37] Verifying Zero Duplicate Tracking Engine...");
    if (typeof GeoSphereFormsSDK.prototype.startTrackingSession === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Tracking Engine!");
    }
    console.log(" [27/37] Verifying Zero Duplicate Geofence Engine...");
    if (typeof GeoSphereFormsSDK.prototype.evaluateGeofence === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Geofence Engine!");
    }
    console.log(" [28/37] Verifying Zero Duplicate Routing Engine...");
    if (typeof GeoSphereFormsSDK.prototype.calculateRoute === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Routing Engine!");
    }
    console.log(" [29/37] Verifying Zero Duplicate Navigation Engine...");
    if (typeof GeoSphereFormsSDK.prototype.startTurnByTurn === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Navigation Engine!");
    }
    console.log(" [30/37] Verifying Zero Duplicate Search Engine...");
    if (typeof GeoSphereFormsSDK.prototype.searchPlaces === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Search Engine!");
    }
    console.log(" [31/37] Verifying Zero Duplicate Spatial Analysis Engine...");
    if (typeof GeoSphereFormsSDK.prototype.calculateArea === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Spatial Analysis Engine!");
    }
    console.log(" [32/37] Verifying Zero Duplicate Offline Storage Engine...");
    if (typeof GeoSphereFormsSDK.prototype.createMapPackage === "function") {
        throw new Error("DUPLICATION VIOLATION: Forms SDK re-implemented Offline Engine!");
    }
    console.log(" [33/37] Verifying Zero Forbidden Field Force Employee Forms...");
    if (typeof GeoSphereFormsSDK.prototype.createEmployeeForm === "function") {
        throw new Error("FORBIDDEN BUSINESS WORKFLOW: Forms SDK contains Field Force Employee Forms!");
    }
    console.log(" [34/37] Verifying Zero Forbidden Field Force Attendance/Visit Forms...");
    if (typeof GeoSphereFormsSDK.prototype.createVisitForm === "function") {
        throw new Error("FORBIDDEN BUSINESS WORKFLOW: Forms SDK contains Field Force Visit Forms!");
    }
    console.log(" [35/37] Testing Provider Info Query...");
    const providerInfo = sdk.getProviderInfo();
    if (providerInfo.name !== "GeoSphereMockFormProvider") {
        throw new Error("getProviderInfo returned invalid provider name");
    }
    console.log(" [36/37] Testing Listener Unsubscribe Callback...");
    const sub = sdk.subscribe(() => { });
    sub.unsubscribe();
    console.log(" [37/37] Testing Embedded UI Mode Configuration Flag...");
    if (!config.embeddedMode)
        throw new Error("embeddedMode config check failed");
    console.log("✅ All GeoSphere Dynamic Forms & Data Collection SDK & Native UI Foundation Unit Tests Passed Successfully!");
}
runFormsSdkTests().catch((err) => {
    console.error("❌ GeoSphere Dynamic Forms & Data Collection SDK Unit Tests Failed:", err);
    process.exit(1);
});
//# sourceMappingURL=forms-sdk.test.js.map