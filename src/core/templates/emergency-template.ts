import { ApplicationConfig } from "../builder/types/builder.types";

export const emergencyTemplate: Partial<ApplicationConfig> = {
  templateId: "template_emergency_response",
  name: "Emergency 911 Incident Dispatch Commander",
  theme: {
    primaryColor: "#881337",
    accentColor: "#F43F5E",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "LOCATION", "GEOFENCING", "ROUTING", "NOTIFICATIONS", "TASKS"],
    engineSettings: {
      location: { updateIntervalMs: 1000, desiredAccuracyMeters: 5 },
      notifications: { highPriorityPush: true },
    },
  },
};
