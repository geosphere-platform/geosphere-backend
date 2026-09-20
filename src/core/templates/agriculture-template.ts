import { ApplicationConfig } from "../builder/types/builder.types";

export const agricultureTemplate: Partial<ApplicationConfig> = {
  templateId: "template_agriculture_crop",
  name: "Smart Agriculture Crop & Parcel Scout",
  theme: {
    primaryColor: "#064E3B",
    accentColor: "#34D399",
    darkMode: false,
  },
  modules: {
    enabledEngines: ["MAP", "GEOFENCING", "FORMS", "MEDIA", "OFFLINE", "ANALYTICS"],
    engineSettings: {
      geofencing: { boundaryToleranceMeters: 2 },
      analytics: { densityCellSizeKm: 0.1 },
    },
  },
};
