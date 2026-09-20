import { ApplicationConfig } from "../builder/types/builder.types";

export const fieldForceTemplate: Partial<ApplicationConfig> = {
  templateId: "template_field_force",
  name: "Field Force Operations & Inspection Suite",
  theme: {
    primaryColor: "#1E293B",
    accentColor: "#10B981",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "FORMS", "TASKS", "MEDIA", "OFFLINE", "SECURITY"],
    engineSettings: {
      offline: { autoSyncIntervalSeconds: 30, conflictStrategy: "SERVER_WINS" },
      forms: { validateStrict: true },
    },
  },
};
