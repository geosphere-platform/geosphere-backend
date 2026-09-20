/**
 * GeoSphere Web SDK — 14 Reusable GIS UI Components
 *
 * Enterprise-grade UI component controllers for building custom GIS applications.
 */
import { GeoSphereThemeManager } from "./theme.js";
// 1. GeoSphereMap Container Component Controller
export class GeoSphereMapComponent {
    renderHTML(mapId = "geosphere-map-canvas") {
        const theme = GeoSphereThemeManager.getTheme();
        return `<div id="${mapId}-wrapper" class="geosphere-ui-root relative w-full h-[520px] rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      <div id="${mapId}" class="w-full h-full"></div>
      <div class="absolute top-4 right-4 z-10 flex gap-2">
        <span class="px-2.5 py-1 text-xs font-mono rounded bg-slate-900/80 text-emerald-400 border border-slate-700 backdrop-blur">
          GPS LOCK • EPSG:4326
        </span>
      </div>
    </div>`;
    }
}
// 2. LayerManager Component Controller
export class GeoSphereLayerManagerComponent {
    renderHTML(layers) {
        const theme = GeoSphereThemeManager.getTheme();
        return `<div class="geosphere-card p-4 space-y-3 font-sans">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <span class="font-bold text-sm text-slate-100">Layer Manager</span>
        <span class="text-xs font-mono text-indigo-400">${layers.length} Layers</span>
      </div>
      <div class="space-y-2 max-h-48 overflow-y-auto">
        ${layers
            .map((lyr) => `<div class="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800 text-xs">
          <label class="flex items-center gap-2 cursor-pointer text-slate-200">
            <input type="checkbox" ${lyr.visible ? "checked" : ""} class="rounded bg-slate-800 border-slate-700 text-indigo-500" />
            <span>${lyr.name}</span>
          </label>
          <input type="range" min="0" max="100" value="${(lyr.opacity ?? 1) * 100}" class="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer" />
        </div>`)
            .join("")}
      </div>
    </div>`;
    }
}
// 3. BaseMapSelector Component Controller (6 View Types)
export class GeoSphereBaseMapSelectorComponent {
    renderHTML(activeBasemap) {
        const basemaps = [
            { id: "standard", name: "STANDARD" },
            { id: "light", name: "LIGHT" },
            { id: "dark", name: "DARK" },
            { id: "satellite", name: "SATELLITE" },
            { id: "terrain", name: "TERRAIN" },
            { id: "topographic", name: "TOPOGRAPHIC" },
        ];
        return `<div class="geosphere-card p-3 space-y-2 font-mono text-xs">
      <span class="text-slate-400 font-bold text-[11px] block">BASEMAP VIEW TYPE:</span>
      <div class="grid grid-cols-3 gap-1.5">
        ${basemaps
            .map((bm) => `<button class="px-2 py-1.5 rounded font-bold transition-all text-center ${activeBasemap === bm.id
            ? "bg-indigo-600 text-white shadow"
            : "bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200"}">${bm.name}</button>`)
            .join("")}
      </div>
    </div>`;
    }
}
// 4. JurisdictionSelector Component Controller
export class GeoSphereJurisdictionSelectorComponent {
    renderHTML(jurisdictions) {
        return `<div class="geosphere-card p-4 space-y-3 font-sans text-xs">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <span class="font-bold text-slate-100">Jurisdiction & Boundaries</span>
        <span class="text-[10px] font-mono text-emerald-400">6-Level Hierarchy</span>
      </div>
      <input type="text" placeholder="Search jurisdiction boundary..." class="w-full px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500" />
      <div class="space-y-1.5 max-h-40 overflow-y-auto">
        ${jurisdictions
            .map((j) => `<div class="flex justify-between items-center p-2 rounded bg-slate-900/60 border border-slate-800">
          <span class="font-medium text-slate-200">${j.name}</span>
          <span class="px-1.5 py-0.5 text-[9px] font-mono rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">${j.level}</span>
        </div>`)
            .join("")}
      </div>
    </div>`;
    }
}
// 5. MapSearch Component Controller
export class GeoSphereMapSearchComponent {
    renderHTML() {
        return `<div class="relative w-full">
      <input type="text" placeholder="Search features, coordinates (21.1458, 79.0882)..." class="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 font-mono text-xs focus:outline-none focus:border-indigo-500 shadow-xl backdrop-blur" />
      <span class="absolute right-3 top-2.5 text-slate-500 text-xs font-mono">🔍</span>
    </div>`;
    }
}
// 6. FeatureDetails Component Controller
export class GeoSphereFeatureDetailsComponent {
    renderHTML(feature) {
        return `<div class="geosphere-card p-4 space-y-3 font-sans text-xs">
      <div class="flex justify-between items-center border-b border-slate-800 pb-2">
        <span class="font-bold text-slate-100">${feature.title}</span>
        <span class="text-[10px] font-mono text-slate-400">ID: ${feature.id}</span>
      </div>
      <div class="space-y-1.5 font-mono text-[11px]">
        ${Object.entries(feature.properties)
            .map(([k, v]) => `<div class="flex justify-between p-1.5 rounded bg-slate-900 border border-slate-800">
          <span class="text-slate-400">${k}:</span>
          <span class="text-slate-100 font-bold">${String(v)}</span>
        </div>`)
            .join("")}
      </div>
    </div>`;
    }
}
// 7. Legend Component Controller
export class GeoSphereLegendComponent {
    renderHTML(items) {
        return `<div class="geosphere-card p-3 space-y-2 font-mono text-xs">
      <span class="text-slate-400 font-bold text-[11px] block border-b border-slate-800 pb-1">MAP LEGEND</span>
      <div class="space-y-1">
        ${items
            .map((item) => `<div class="flex items-center gap-2 text-slate-300">
          <span class="w-3 h-3 rounded-full inline-block border border-white/20" style="background-color: ${item.color};"></span>
          <span>${item.label}</span>
        </div>`)
            .join("")}
      </div>
    </div>`;
    }
}
// 8. MapControls Component Controller
export class GeoSphereMapControlsComponent {
    renderHTML() {
        return `<div class="flex flex-col gap-1 font-mono text-xs">
      <button title="Zoom In" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 flex items-center justify-center font-bold">+</button>
      <button title="Zoom Out" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 text-slate-200 hover:bg-slate-800 flex items-center justify-center font-bold">-</button>
      <button title="My Location" class="w-8 h-8 rounded bg-slate-900 border border-slate-800 text-emerald-400 hover:bg-slate-800 flex items-center justify-center">🎯</button>
    </div>`;
    }
}
// 9. MeasureTool Component Controller
export class GeoSphereMeasureToolComponent {
    renderHTML() {
        return `<div class="geosphere-card p-3 flex gap-2 font-mono text-xs">
      <button class="px-3 py-1.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold">📏 Distance</button>
      <button class="px-3 py-1.5 rounded bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200">📐 Polygon Area</button>
      <button class="px-2 py-1.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">Clear</button>
    </div>`;
    }
}
// 10. DrawTool Component Controller
export class GeoSphereDrawToolComponent {
    renderHTML() {
        return `<div class="geosphere-card p-3 flex gap-1.5 font-mono text-xs">
      <button class="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">📍 Point</button>
      <button class="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">〰️ Line</button>
      <button class="px-2.5 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800">⬡ Polygon</button>
    </div>`;
    }
}
// 11. EditTool Component Controller
export class GeoSphereEditToolComponent {
    renderHTML() {
        return `<div class="geosphere-card p-3 flex items-center justify-between font-mono text-xs">
      <span class="text-slate-400">Vertex Snapping:</span>
      <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">ENABLED (15px)</span>
    </div>`;
    }
}
// 12. SelectionTool Component Controller
export class GeoSphereSelectionToolComponent {
    renderHTML() {
        return `<div class="geosphere-card p-3 flex gap-1.5 font-mono text-xs">
      <button class="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold">Single Click</button>
      <button class="px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">Box Select</button>
      <button class="px-2.5 py-1 rounded bg-slate-900 text-slate-400 border border-slate-800">Polygon Select</button>
    </div>`;
    }
}
// 13. MapStyleEditor Component Controller (Advanced GIS Symbology System)
export class GeoSphereMapStyleEditorComponent {
    renderHTML() {
        return `<div class="geosphere-card p-4 space-y-3 font-sans text-xs">
      <span class="font-bold text-slate-100 block border-b border-slate-800 pb-1">Enterprise GIS Symbology & Style Editor</span>
      <div class="grid grid-cols-2 gap-2 font-mono text-[11px]">
        <div>
          <label class="text-slate-400 block mb-1">Fill Color</label>
          <input type="color" value="#3b82f6" class="w-full h-8 bg-slate-900 border border-slate-800 rounded cursor-pointer" />
        </div>
        <div>
          <label class="text-slate-400 block mb-1">Stroke Color</label>
          <input type="color" value="#2563eb" class="w-full h-8 bg-slate-900 border border-slate-800 rounded cursor-pointer" />
        </div>
      </div>
    </div>`;
    }
}
// 14. MapSettings Component Controller
export class GeoSphereMapSettingsComponent {
    renderHTML() {
        return `<div class="geosphere-card p-4 space-y-2 font-mono text-xs">
      <div class="flex justify-between text-slate-400">
        <span>Spatial Reference:</span>
        <span class="text-emerald-400 font-bold">EPSG:4326</span>
      </div>
      <div class="flex justify-between text-slate-400">
        <span>Tile Cache Strategy:</span>
        <span class="text-indigo-400 font-bold">IndexedDB Cache</span>
      </div>
    </div>`;
    }
}
//# sourceMappingURL=ui-components.js.map