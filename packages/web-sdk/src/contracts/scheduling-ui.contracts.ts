/**
 * GeoSphere Scheduling SDK UI Component & Ready-Made Screen Definitions
 * Multi-Platform Target Definitions for Web (React/Next), Android (Compose), and iOS (SwiftUI)
 */

import { GeoSphereComponentDefinition, GeoSphereScreenDefinition } from "./ui.contracts.js";

export const SCHEDULING_UI_COMPONENTS: Record<string, GeoSphereComponentDefinition> = {
  TIME_SLOT_PICKER: {
    id: "scheduling.time-slot-picker",
    name: "Time Slot Selection Component",
    version: "1.0.0",
    moduleId: "scheduling",
    description: "Interactive time slot picker with availability indicators and duration chips",
    inputs: [
      { name: "slots", type: "GeoSphereTimeSlot[]", required: true, description: "Generated time slots list" }
    ],
    outputs: ["onSlotSelect"],
    events: ["scheduling.appointmentCreated"],
    requiredPermissions: ["scheduling.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "TimeSlotPicker", framework: "react" },
      { platform: "android", componentSymbol: "TimeSlotPicker", framework: "compose" },
      { platform: "ios", componentSymbol: "TimeSlotPicker", framework: "swiftui" }
    ]
  },
  SCHEDULE_MAP: {
    id: "scheduling.schedule-map",
    name: "Schedule Spatial Map Component",
    version: "1.0.0",
    moduleId: "scheduling",
    description: "Spatial calendar map rendering scheduled events, resource positions, and appointment overlays",
    inputs: [
      { name: "events", type: "GeoSphereScheduleEvent[]", required: true, description: "Scheduled events list" }
    ],
    outputs: ["onEventSelect"],
    events: ["scheduling.eventCreated"],
    requiredPermissions: ["scheduling.read"],
    supportedPlatforms: ["web", "android", "ios"],
    supportsDensity: ["compact", "comfortable", "spacious"],
    supportsBreakpoints: ["mobile", "tablet", "desktop"],
    adapters: [
      { platform: "web", componentSymbol: "ScheduleMap", framework: "react" },
      { platform: "android", componentSymbol: "ScheduleMap", framework: "compose" },
      { platform: "ios", componentSymbol: "ScheduleMap", framework: "swiftui" }
    ]
  }
};

export const SCHEDULING_READY_MADE_SCREENS: Record<string, GeoSphereScreenDefinition> = {
  CALENDAR_SCREEN: {
    id: "scheduling.calendar-screen",
    title: "Calendar Master Screen",
    version: "1.0.0",
    moduleId: "scheduling",
    description: "Full-screen multi-view calendar with Day, Week, Month, and Agenda toggle controls",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["CALENDAR_MANAGEMENT", "SCHEDULE_GENERATION"],
    requiredPermissions: ["scheduling.read"],
    containedComponents: ["scheduling.time-slot-picker"],
    adapters: [
      { platform: "web", componentSymbol: "CalendarScreen", framework: "react" },
      { platform: "android", componentSymbol: "CalendarScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "CalendarScreen", framework: "swiftui" }
    ]
  },
  SCHEDULE_MAP_SCREEN: {
    id: "scheduling.map-screen",
    title: "Schedule Spatial Map Screen",
    version: "1.0.0",
    moduleId: "scheduling",
    description: "Full-screen spatial map displaying event locations, resource positions, and time filter controls",
    mode: "full-screen",
    supportedPlatforms: ["web", "android", "ios"],
    requiredCapabilities: ["MAP_VISUALIZATION"],
    requiredPermissions: ["scheduling.read"],
    containedComponents: ["scheduling.schedule-map"],
    adapters: [
      { platform: "web", componentSymbol: "ScheduleMapScreen", framework: "react" },
      { platform: "android", componentSymbol: "ScheduleMapScreen", framework: "compose" },
      { platform: "ios", componentSymbol: "ScheduleMapScreen", framework: "swiftui" }
    ]
  }
};
