/**
 * GeoSphere Forms SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const FORMS_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  FORM_RENDERER: {
    id: "forms.form-renderer",
    name: "Dynamic Form Renderer Component",
    version: "1.0.0",
    moduleId: "forms",
    description: "Main form container rendering sections, fields, dependency logic, and validation messages",
    inputs: [
      { name: "schema", type: "GeoSphereFormSchema", required: true, description: "Form schema struct" }
    ],
    outputs: ["onFieldChange", "onSubmit", "onSaveDraft"],
    events: ["forms.schemaLoaded", "forms.fieldChanged", "forms.submitted"],
    requiredPermissions: ["forms.execute"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "FormRenderer", framework: "react" },
      { platform: "android", componentSymbol: "FormRenderer", framework: "compose" },
      { platform: "ios", componentSymbol: "FormRenderer", framework: "swiftui" }
    ]
  },
  SIGNATURE_PAD: {
    id: "forms.signature-pad",
    name: "Digital Signature Canvas Component",
    version: "1.0.0",
    moduleId: "forms",
    description: "Canvas touch signature capture control supporting clear, undo, and preview",
    inputs: [
      { name: "value", type: "GeoSphereFormSignature", required: false, description: "Signature struct" }
    ],
    outputs: ["onCapture", "onClear"],
    events: ["forms.fieldChanged"],
    requiredPermissions: ["forms.execute"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "SignaturePad", framework: "react" },
      { platform: "android", componentSymbol: "SignaturePad", framework: "compose" },
      { platform: "ios", componentSymbol: "SignaturePad", framework: "swiftui" }
    ]
  },
  LOCATION_PICKER: {
    id: "forms.location-picker",
    name: "Forms Explicit Location Picker Component",
    version: "1.0.0",
    moduleId: "forms",
    description: "Location capture control integrating with GeoSphere Location SDK",
    inputs: [
      { name: "value", type: "Record<string, number>", required: false, description: "Coordinates" }
    ],
    outputs: ["onLocationCaptured"],
    events: ["forms.fieldChanged"],
    requiredPermissions: ["forms.execute"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "LocationPicker", framework: "react" },
      { platform: "android", componentSymbol: "LocationPicker", framework: "compose" },
      { platform: "ios", componentSymbol: "LocationPicker", framework: "swiftui" }
    ]
  }
};

export const FORMS_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  FORM_RENDERER_SCREEN: {
    id: "forms.renderer-screen",
    title: "Dynamic Form Renderer Screen",
    version: "1.0.0",
    moduleId: "forms",
    description: "Full-screen dynamic form renderer with draft autosave, progress indicators, and actions",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["SCHEMA_LOADING", "DYNAMIC_RENDERING", "FIELD_DEPENDENCIES", "VALIDATION"],
    requiredPermissions: ["forms.execute"],
    containedComponents: ["forms.form-renderer", "forms.signature-pad", "forms.location-picker"],
    adapters: [
      { platform: "web", componentSymbol: "FormRendererScreen", framework: "react" },
      { platform: "android", componentSymbol: "FormRendererScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "FormRendererScreen", framework: "swiftui" }
    ]
  },
  DRAFT_LIST_SCREEN: {
    id: "forms.draft-list-screen",
    title: "Offline Form Drafts Screen",
    version: "1.0.0",
    moduleId: "forms",
    description: "Screen displaying saved offline drafts, completion status, and resume actions",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["DRAFT_AUTOSAVE", "OFFLINE_SYNC"],
    requiredPermissions: ["forms.execute"],
    containedComponents: ["forms.form-renderer"],
    adapters: [
      { platform: "web", componentSymbol: "DraftListScreen", framework: "react" },
      { platform: "android", componentSymbol: "DraftListScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "DraftListScreen", framework: "swiftui" }
    ]
  },
  SIGNATURE_CAPTURE_SCREEN: {
    id: "forms.signature-screen",
    title: "Signature Capture Studio Screen",
    version: "1.0.0",
    moduleId: "forms",
    description: "Dedicated touch/pen digital signature capture screen",
    mode: "component",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["SIGNATURE_CAPTURE"],
    requiredPermissions: ["forms.execute"],
    containedComponents: ["forms.signature-pad"],
    adapters: [
      { platform: "web", componentSymbol: "SignatureCaptureScreen", framework: "react" },
      { platform: "android", componentSymbol: "SignatureCaptureScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "SignatureCaptureScreen", framework: "swiftui" }
    ]
  }
};
