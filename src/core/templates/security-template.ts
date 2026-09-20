import { ApplicationConfig } from "../builder/types/builder.types";

export const securityTemplate: Partial<ApplicationConfig> = {
  templateId: "template_security_patrol",
  name: "Facility Guard Patrol & Checkpoint Verification",
  theme: {
    primaryColor: "#18181B",
    accentColor: "#A1A1AA",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "GEOFENCING", "TASKS", "OFFLINE", "SECURITY", "NOTIFICATIONS"],
    engineSettings: {
      security: { enforceHardwareKeyStore: true, auditAllCheckpoints: true },
      geofencing: { dwellTimeThresholdSeconds: 60 },
    },
  },
};
