import { ApplicationConfig } from "../builder/types/builder.types";

export const fleetTemplate: Partial<ApplicationConfig> = {
  templateId: "template_fleet_management",
  name: "Fleet & Asset Tracking Pro",
  theme: {
    primaryColor: "#0F172A",
    accentColor: "#3B82F6",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "LOCATION", "TRACKING", "ROUTING", "ANALYTICS", "NOTIFICATIONS"],
    engineSettings: {
      location: { updateIntervalMs: 5000, desiredAccuracyMeters: 10 },
      analytics: { enableHeatmap: true, enableTrajectoryAnalysis: true },
    },
  },
};
