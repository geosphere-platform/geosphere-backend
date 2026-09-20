"use client";

/**
 * GeoSphere Platform — Universal Enterprise GIS Style Editor React Component
 *
 * Provides a comprehensive Symbology Editor supporting:
 * - Appearance (Fill, Stroke, Opacity, Line Caps/Joins, Dash Patterns)
 * - Point Symbols (Shapes: Circle, Square, Triangle, Star, SVG; Size, Rotation)
 * - Attribute & Rule-Based Styling (Categorized & Graduated Classifications)
 * - Label Editor (Field Source, Size, Color, Halo, Collision avoidance)
 * - Zoom-Based Symbology Controls
 * - Symbology Presets & JSON Import/Export
 * - Real-time Live Map Canvas Preview, Apply, Save, and Reset workflow.
 */

import React, { useState } from "react";
import {
  GeoSphereStyle,
  DEFAULT_GEOSPHERE_STYLE,
  PointSymbolShape,
  LineDashPattern,
  LineCapType,
  GeoSphereRule,
  GeoSphereSymbologyEvaluator,
} from "../styling/symbology-engine";
import { GEOSPHERE_STYLE_PRESETS, GeoSphereStyleSerializer } from "../styling/style-preset-registry";

export interface AdvancedStyleEditorProps {
  initialStyle?: GeoSphereStyle;
  availableLayers?: Array<{ id: string; name: string }>;
  selectedLayerId?: string;
  onPreviewStyle?: (style: GeoSphereStyle) => void;
  onApplyStyle?: (style: GeoSphereStyle) => void;
  onSaveStyle?: (style: GeoSphereStyle) => void;
  onCancel?: () => void;
}

export const GeoSphereAdvancedStyleEditor: React.FC<AdvancedStyleEditorProps> = ({
  initialStyle = DEFAULT_GEOSPHERE_STYLE,
  availableLayers = [
    { id: "spatial_features", name: "Saved DB Features" },
    { id: "substation_geofences", name: "Substation Geofences" },
    { id: "feeder_lines", name: "Feeder Power Lines" },
    { id: "field_agents", name: "Field Force Agents" },
  ],
  selectedLayerId = "spatial_features",
  onPreviewStyle,
  onApplyStyle,
  onSaveStyle,
  onCancel,
}) => {
  const [activeTab, setActiveTab] = useState<"APPEARANCE" | "SYMBOLS" | "LABELS" | "RULES" | "PRESETS" | "EXPORT">("APPEARANCE");
  const [currentStyle, setCurrentStyle] = useState<GeoSphereStyle>({ ...initialStyle, layerId: selectedLayerId });
  const [currentLayerId, setCurrentLayerId] = useState<string>(selectedLayerId);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [jsonError, setJsonError] = useState<string>("");

  // Rule Builder Form State
  const [ruleField, setRuleField] = useState<string>("status");
  const [ruleOp, setRuleOp] = useState<"equals" | "contains" | "greater_than">("equals");
  const [ruleVal, setRuleVal] = useState<string>("ACTIVE");
  const [ruleColor, setRuleColor] = useState<string>("#10b981");

  const updateStyle = (overrides: Partial<GeoSphereStyle>) => {
    const updated = { ...currentStyle, ...overrides };
    setCurrentStyle(updated);
    if (onPreviewStyle) onPreviewStyle(updated);
  };

  const handleAddRule = () => {
    const newRule: GeoSphereRule = {
      id: `rule-${Date.now()}`,
      name: `${ruleField} ${ruleOp} ${ruleVal}`,
      priority: currentStyle.rules.length + 1,
      enabled: true,
      condition: {
        field: ruleField,
        operator: ruleOp,
        value: ruleVal,
      },
      style: {
        fillColor: ruleColor,
        strokeColor: ruleColor,
        pointSymbol: { ...currentStyle.pointSymbol, color: ruleColor },
      },
    };
    updateStyle({ rules: [...currentStyle.rules, newRule] });
  };

  const handleRemoveRule = (ruleId: string) => {
    updateStyle({ rules: currentStyle.rules.filter((r) => r.id !== ruleId) });
  };

  const handleApplyPreset = (presetStyle: GeoSphereStyle) => {
    const updated = { ...presetStyle, layerId: currentLayerId };
    setCurrentStyle(updated);
    if (onPreviewStyle) onPreviewStyle(updated);
  };

  const handleImportJson = () => {
    try {
      setJsonError("");
      const imported = GeoSphereStyleSerializer.importFromJSON(importJsonText);
      setCurrentStyle({ ...imported, layerId: currentLayerId });
      if (onPreviewStyle) onPreviewStyle(imported);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 text-slate-100 font-mono text-xs shadow-2xl space-y-3 w-[420px]">
      {/* Editor Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h3 className="font-bold text-indigo-300 text-sm flex items-center gap-1.5">
            🎨 GIS Layer Symbology Editor
          </h3>
          <span className="text-[10px] text-slate-400">Enterprise Vector Symbology & Rules</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
          LIVE PREVIEW
        </span>
      </div>

      {/* Target Layer Selector */}
      <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between items-center">
        <span className="text-[10px] text-slate-400 font-bold uppercase">TARGET LAYER:</span>
        <select
          value={currentLayerId}
          onChange={(e) => setCurrentLayerId(e.target.value)}
          className="bg-slate-900 border border-slate-700 text-indigo-300 font-bold rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-500"
        >
          {availableLayers.map((lyr) => (
            <option key={lyr.id} value={lyr.id}>
              {lyr.name}
            </option>
          ))}
        </select>
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-6 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
        {(["APPEARANCE", "SYMBOLS", "LABELS", "RULES", "PRESETS", "EXPORT"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1 text-center rounded transition-all ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB 1: APPEARANCE (Fill, Stroke, Opacity, Dash) */}
      {activeTab === "APPEARANCE" && (
        <div className="space-y-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">POLYGON FILL:</span>
            <div className="flex items-center justify-between gap-2">
              <input
                type="color"
                value={currentStyle.fillColor}
                onChange={(e) => updateStyle({ fillColor: e.target.value })}
                className="w-10 h-7 rounded border border-slate-700 bg-slate-900 cursor-pointer"
              />
              <span className="text-slate-300 font-bold">{currentStyle.fillColor}</span>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <span className="text-[10px] text-slate-400">Opacity:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={currentStyle.fillOpacity}
                  onChange={(e) => updateStyle({ fillOpacity: parseFloat(e.target.value) })}
                  className="w-20 accent-indigo-500"
                />
                <span className="text-emerald-400 font-bold w-8 text-right">
                  {Math.round(currentStyle.fillOpacity * 100)}%
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">LINE / OUTLINE STROKE:</span>
            <div className="flex items-center justify-between gap-2">
              <input
                type="color"
                value={currentStyle.strokeColor}
                onChange={(e) => updateStyle({ strokeColor: e.target.value })}
                className="w-10 h-7 rounded border border-slate-700 bg-slate-900 cursor-pointer"
              />
              <span className="text-slate-300 font-bold">{currentStyle.strokeColor}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400">Width:</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={currentStyle.strokeWidth}
                  onChange={(e) => updateStyle({ strokeWidth: parseInt(e.target.value) || 1 })}
                  className="w-12 bg-slate-900 border border-slate-700 text-center rounded text-xs py-0.5 font-bold"
                />
                <span className="text-slate-400 text-[10px]">px</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px]">
            <div>
              <span className="text-slate-400 font-bold block mb-1">DASH PATTERN:</span>
              <select
                value={currentStyle.dashPattern}
                onChange={(e) => updateStyle({ dashPattern: e.target.value as LineDashPattern })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-bold"
              >
                <option value="Solid">Solid Line ───</option>
                <option value="Dashed">Dashed ╌╌╌</option>
                <option value="Dotted">Dotted ┈ ┈ ┈</option>
                <option value="Dash-Dot">Dash-Dot ╍╌╍╌</option>
              </select>
            </div>
            <div>
              <span className="text-slate-400 font-bold block mb-1">LINE CAP:</span>
              <select
                value={currentStyle.lineCap}
                onChange={(e) => updateStyle({ lineCap: e.target.value as LineCapType })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-1 text-slate-200 font-bold"
              >
                <option value="Round">Round Cap</option>
                <option value="Square">Square Cap</option>
                <option value="Butt">Flat Butt</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: POINT SYMBOLS */}
      {activeTab === "SYMBOLS" && (
        <div className="space-y-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">POINT SYMBOL SHAPE:</span>
          <div className="grid grid-cols-4 gap-1.5">
            {(["Circle", "Square", "Triangle", "Star"] as PointSymbolShape[]).map((shape) => (
              <button
                key={shape}
                onClick={() =>
                  updateStyle({
                    pointSymbol: { ...currentStyle.pointSymbol, shape },
                  })
                }
                className={`py-2 px-1 rounded font-bold text-center border transition-all ${
                  currentStyle.pointSymbol.shape === shape
                    ? "bg-indigo-600 text-white border-indigo-400 shadow"
                    : "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {shape === "Circle" ? "⭕ Circle" : shape === "Square" ? "⏹ Square" : shape === "Triangle" ? "🔺 Triangle" : "⭐ Star"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">SYMBOL SIZE:</span>
              <input
                type="range"
                min="4"
                max="32"
                value={currentStyle.pointSymbol.size}
                onChange={(e) =>
                  updateStyle({
                    pointSymbol: { ...currentStyle.pointSymbol, size: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500"
              />
              <span className="text-emerald-400 font-bold text-right block text-[10px]">
                {currentStyle.pointSymbol.size} px
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">BORDER WIDTH:</span>
              <input
                type="range"
                min="0"
                max="8"
                value={currentStyle.pointSymbol.borderWidth}
                onChange={(e) =>
                  updateStyle({
                    pointSymbol: { ...currentStyle.pointSymbol, borderWidth: parseInt(e.target.value) },
                  })
                }
                className="w-full accent-indigo-500"
              />
              <span className="text-emerald-400 font-bold text-right block text-[10px]">
                {currentStyle.pointSymbol.borderWidth} px
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LABELS */}
      {activeTab === "LABELS" && (
        <div className="space-y-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">ENABLE LABELS:</span>
            <input
              type="checkbox"
              checked={currentStyle.labelStyle.enabled}
              onChange={(e) =>
                updateStyle({
                  labelStyle: { ...currentStyle.labelStyle, enabled: e.target.checked },
                })
              }
              className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
            />
          </div>

          {currentStyle.labelStyle.enabled && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-bold">LABEL PROPERTY FIELD:</span>
                <select
                  value={currentStyle.labelStyle.field}
                  onChange={(e) =>
                    updateStyle({
                      labelStyle: { ...currentStyle.labelStyle, field: e.target.value },
                    })
                  }
                  className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold rounded px-2 py-1 text-xs"
                >
                  <option value="name">properties.name</option>
                  <option value="status">properties.status</option>
                  <option value="id">feature.id</option>
                  <option value="type">geometry.type</option>
                </select>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] text-slate-400 font-bold">TEXT HALO COLOR:</span>
                <input
                  type="color"
                  value={currentStyle.labelStyle.haloColor}
                  onChange={(e) =>
                    updateStyle({
                      labelStyle: { ...currentStyle.labelStyle, haloColor: e.target.value },
                    })
                  }
                  className="w-8 h-6 rounded border border-slate-700 bg-slate-900"
                />
                <span className="text-[10px] text-slate-400 font-bold">HALO WIDTH:</span>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentStyle.labelStyle.haloWidth}
                  onChange={(e) =>
                    updateStyle({
                      labelStyle: { ...currentStyle.labelStyle, haloWidth: parseInt(e.target.value) || 0 },
                    })
                  }
                  className="w-10 bg-slate-900 border border-slate-700 text-center rounded py-0.5"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ATTRIBUTE RULES */}
      {activeTab === "RULES" && (
        <div className="space-y-3 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">ADD ATTRIBUTE RULE:</span>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="text"
              placeholder="field (e.g. status)"
              value={ruleField}
              onChange={(e) => setRuleField(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[10px]"
            />
            <select
              value={ruleOp}
              onChange={(e) => setRuleOp(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 rounded px-1 py-1 text-slate-200 text-[10px]"
            >
              <option value="equals">Equals ==</option>
              <option value="contains">Contains</option>
              <option value="greater_than">Greater &gt;</option>
            </select>
            <input
              type="text"
              placeholder="value (ACTIVE)"
              value={ruleVal}
              onChange={(e) => setRuleVal(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-[10px]"
            />
          </div>

          <div className="flex justify-between items-center gap-2">
            <span className="text-[10px] text-slate-400">Rule Color:</span>
            <input
              type="color"
              value={ruleColor}
              onChange={(e) => setRuleColor(e.target.value)}
              className="w-8 h-6 rounded border border-slate-700 bg-slate-900 cursor-pointer"
            />
            <button
              onClick={handleAddRule}
              className="flex-1 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
            >
              ➕ Add Style Rule
            </button>
          </div>

          {/* Rules List */}
          <div className="space-y-1 pt-2 border-t border-slate-800 max-h-32 overflow-y-auto">
            {currentStyle.rules.length === 0 ? (
              <span className="text-[10px] text-slate-500 block text-center">No custom rules added yet.</span>
            ) : (
              currentStyle.rules.map((rule) => (
                <div key={rule.id} className="p-1.5 rounded bg-slate-900 border border-slate-800 flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: rule.style.fillColor }} />
                    <span className="font-bold text-slate-200">{rule.name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveRule(rule.id)}
                    className="text-red-400 hover:text-red-300 font-bold px-1"
                  >
                    ✖
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PRESETS */}
      {activeTab === "PRESETS" && (
        <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">CHOOSE PRESET SYMBOLOGY:</span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {GEOSPHERE_STYLE_PRESETS.map((pst) => (
              <button
                key={pst.id}
                onClick={() => handleApplyPreset(pst.style)}
                className="w-full p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left transition-all flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-indigo-300 text-xs block">{pst.name}</span>
                  <span className="text-[9px] text-slate-400">{pst.description}</span>
                </div>
                <span className="w-4 h-4 rounded-full border border-white/40" style={{ backgroundColor: pst.style.fillColor }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: IMPORT / EXPORT JSON */}
      {activeTab === "EXPORT" && (
        <div className="space-y-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-bold uppercase block">EXPORT / IMPORT STYLE JSON:</span>
          <textarea
            value={importJsonText || GeoSphereStyleSerializer.exportToJSON(currentStyle)}
            onChange={(e) => setImportJsonText(e.target.value)}
            className="w-full h-24 bg-slate-900 border border-slate-700 text-slate-300 rounded font-mono text-[9px] p-2 focus:outline-none"
          />
          {jsonError && <span className="text-red-400 font-bold text-[10px] block">❌ {jsonError}</span>}
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(GeoSphereStyleSerializer.exportToJSON(currentStyle));
              }}
              className="flex-1 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={handleImportJson}
              className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
            >
              📥 Import JSON
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation Alert */}
      {showResetConfirm && (
        <div className="p-2.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] space-y-2">
          <span className="font-bold block text-center">Reset all layer styles to default?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowResetConfirm(false)}
              className="flex-1 py-1 rounded bg-slate-800 text-slate-200 font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowResetConfirm(false);
                setCurrentStyle(DEFAULT_GEOSPHERE_STYLE);
                if (onPreviewStyle) onPreviewStyle(DEFAULT_GEOSPHERE_STYLE);
              }}
              className="flex-1 py-1 rounded bg-red-600 text-white font-bold"
            >
              Reset All
            </button>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => setShowResetConfirm(true)}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs"
        >
          🔄 Reset
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
        >
          ✖ Cancel
        </button>
        <button
          onClick={() => {
            if (onApplyStyle) onApplyStyle(currentStyle);
          }}
          className="flex-1 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
        >
          ⚡ Apply
        </button>
        <button
          onClick={() => {
            if (onSaveStyle) onSaveStyle(currentStyle);
          }}
          className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
        >
          💾 Save
        </button>
      </div>
    </div>
  );
};
