import { ApplicationConfig } from "../builder/types/builder.types";

export const utilitiesTemplate: Partial<ApplicationConfig> = {
  templateId: "template_utilities_infra",
  name: "Utilities Pipeline & Grid Inspector",
  theme: {
    primaryColor: "#172554",
    accentColor: "#38BDF8",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "ROUTING", "FORMS", "TASKS", "MEDIA", "OFFLINE"],
    engineSettings: {
      forms: { requirePhotoAttachments: true },
      offline: { offlineTileMaxZoom: 18 },
    },
  },
};
