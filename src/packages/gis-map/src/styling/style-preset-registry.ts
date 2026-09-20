/**
 * GeoSphere Platform — GIS Symbology Preset Registry & Serialization
 *
 * Predefined enterprise styling themes and JSON import/export adapters.
 */

import { GeoSphereStyle, DEFAULT_GEOSPHERE_STYLE } from "./symbology-engine";

export interface GeoSphereStylePreset {
  id: string;
  name: string;
  description: string;
  category: "Standard" | "Enterprise" | "Thematic" | "Emergency";
  style: GeoSphereStyle;
}

export const GEOSPHERE_STYLE_PRESETS: GeoSphereStylePreset[] = [
  {
    id: "preset_default",
    name: "Default Blue GIS",
    description: "Standard clean blue GIS vector style.",
    category: "Standard",
    style: DEFAULT_GEOSPHERE_STYLE,
  },
  {
    id: "preset_dark_gis",
    name: "Dark Enterprise GIS",
    description: "Neon cyan and violet highlights for dark basemaps.",
    category: "Enterprise",
    style: {
      ...DEFAULT_GEOSPHERE_STYLE,
      id: "preset_dark_gis",
      name: "Dark Enterprise GIS",
      strokeColor: "#06b6d4",
      fillColor: "#06b6d4",
      fillOpacity: 0.3,
      strokeWidth: 3,
      pointSymbol: {
        shape: "Circle",
        size: 9,
        color: "#06b6d4",
        borderColor: "#ffffff",
        borderWidth: 2,
        rotation: 0,
        opacity: 1,
      },
    },
  },
  {
    id: "preset_satellite",
    name: "Satellite Contrast Overlay",
    description: "High visibility yellow & magenta lines for imagery basemaps.",
    category: "Standard",
    style: {
      ...DEFAULT_GEOSPHERE_STYLE,
      id: "preset_satellite",
      name: "Satellite Overlay",
      strokeColor: "#eab308",
      fillColor: "#eab308",
      fillOpacity: 0.35,
      strokeWidth: 4,
      pointSymbol: {
        shape: "Star",
        size: 11,
        color: "#eab308",
        borderColor: "#0f172a",
        borderWidth: 2,
        rotation: 0,
        opacity: 1,
      },
    },
  },
  {
    id: "preset_emergency",
    name: "Emergency High Priority",
    description: "Vibrant red warning symbols with white halos for critical assets.",
    category: "Emergency",
    style: {
      ...DEFAULT_GEOSPHERE_STYLE,
      id: "preset_emergency",
      name: "Emergency Alert",
      strokeColor: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 0.45,
      strokeWidth: 4,
      dashPattern: "Dashed",
      pointSymbol: {
        shape: "Triangle",
        size: 12,
        color: "#ef4444",
        borderColor: "#ffffff",
        borderWidth: 3,
        rotation: 0,
        opacity: 1,
      },
    },
  },
  {
    id: "preset_minimal",
    name: "Minimalist Slate",
    description: "Subtle gray outlines for clean basemap clarity.",
    category: "Standard",
    style: {
      ...DEFAULT_GEOSPHERE_STYLE,
      id: "preset_minimal",
      name: "Minimalist Slate",
      strokeColor: "#64748b",
      fillColor: "#64748b",
      fillOpacity: 0.15,
      strokeWidth: 2,
      pointSymbol: {
        shape: "Square",
        size: 6,
        color: "#64748b",
        borderColor: "#ffffff",
        borderWidth: 1,
        rotation: 0,
        opacity: 1,
      },
    },
  },
];

export class GeoSphereStyleSerializer {
  public static exportToJSON(style: GeoSphereStyle): string {
    return JSON.stringify(
      {
        schemaVersion: "1.0",
        exportedAt: new Date().toISOString(),
        style,
      },
      null,
      2
    );
  }

  public static importFromJSON(jsonString: string): GeoSphereStyle {
    try {
      const parsed = JSON.parse(jsonString);
      const styleData = parsed.style || parsed;
      if (!styleData.id || !styleData.pointSymbol) {
        throw new Error("Invalid GeoSphere Style JSON format.");
      }
      return {
        ...DEFAULT_GEOSPHERE_STYLE,
        ...styleData,
      };
    } catch (e: any) {
      throw new Error(`Failed to parse Style JSON: ${e.message}`);
    }
  }
}
