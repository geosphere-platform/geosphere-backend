import { ApplicationConfig } from "../builder/types/builder.types";

export const deliveryTemplate: Partial<ApplicationConfig> = {
  templateId: "template_delivery_logistics",
  name: "Last-Mile Delivery & Dispatch Express",
  theme: {
    primaryColor: "#312E81",
    accentColor: "#F59E0B",
    darkMode: true,
  },
  modules: {
    enabledEngines: ["MAP", "LOCATION", "ROUTING", "TASKS", "NOTIFICATIONS", "OFFLINE"],
    engineSettings: {
      routing: { profile: "driving", optimizeWaypointOrder: true },
      tasks: { autoAssignNextTask: true },
    },
  },
};
