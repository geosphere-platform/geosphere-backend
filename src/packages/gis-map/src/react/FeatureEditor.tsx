"use client";

import React, { useState } from "react";
import { GeoSphereFeature } from "../editing/geospatial-editing-engine";
import { GeoSphereFeatureSchema } from "../features/feature-schema";

export interface GeoSphereFeatureEditorProps {
  feature: GeoSphereFeature;
  schema?: GeoSphereFeatureSchema;
  onSave: (updatedFeature: GeoSphereFeature) => void;
  onCancel: () => void;
}

export const GeoSphereFeatureEditor: React.FC<GeoSphereFeatureEditorProps> = ({
  feature,
  schema,
  onSave,
  onCancel,
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({ ...feature.properties });
  const [featureName, setFeatureName] = useState<string>(feature.properties.name || feature.id);

  const handlePropertyChange = (key: string, value: any) => {
    setProperties({ ...properties, [key]: value });
  };

  const handleSave = () => {
    const updated: GeoSphereFeature = {
      ...feature,
      properties: { ...properties, name: featureName },
      metadata: {
        ...feature.metadata,
        updatedAt: new Date().toISOString(),
        version: (feature.metadata?.version ?? 1) + 1,
      },
    };
    onSave(updated);
  };

  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4 font-mono text-xs text-slate-100 max-w-md w-full shadow-2xl">
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <span className="font-bold text-indigo-400 text-sm">GeoSphere Feature Property Editor</span>
        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
          {feature.geometry.type}
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-slate-400 block mb-1">Feature Name:</label>
          <input
            type="text"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {schema
          ? schema.fields.map((field) => (
              <div key={field.name}>
                <label className="text-slate-400 block mb-1">
                  {field.label} {field.required && <span className="text-red-400">*</span>}:
                </label>
                {field.type === "enum" ? (
                  <select
                    value={properties[field.name] ?? field.defaultValue ?? ""}
                    onChange={(e) => handlePropertyChange(field.name, e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={properties[field.name] ?? ""}
                    onChange={(e) =>
                      handlePropertyChange(
                        field.name,
                        field.type === "number" ? parseFloat(e.target.value) : e.target.value
                      )
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                )}
              </div>
            ))
          : Object.entries(properties)
              .filter(([k]) => k !== "name")
              .map(([k, v]) => (
                <div key={k}>
                  <label className="text-slate-400 block mb-1">{k}:</label>
                  <input
                    type="text"
                    value={String(v)}
                    onChange={(e) => handlePropertyChange(k, e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              ))}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleSave}
          className="flex-1 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export interface GeoSphereFeatureDetailsScreenProps {
  feature: GeoSphereFeature;
  onEdit?: (feature: GeoSphereFeature) => void;
  onDuplicate?: (feature: GeoSphereFeature) => void;
  onDelete?: (featureId: string) => void;
  onZoom?: (feature: GeoSphereFeature) => void;
  onExport?: (feature: GeoSphereFeature) => void;
}

export const GeoSphereFeatureDetailsScreen: React.FC<GeoSphereFeatureDetailsScreenProps> = ({
  feature,
  onEdit,
  onDuplicate,
  onDelete,
  onZoom,
  onExport,
}) => {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 font-mono text-xs text-slate-100 max-w-sm w-full shadow-2xl">
      <div className="flex justify-between items-start border-b border-slate-800 pb-2">
        <div>
          <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">
            Spatial Feature Inspector
          </span>
          <h3 className="font-bold text-sm text-slate-100">{feature.properties.name || feature.id}</h3>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          {feature.geometry.type}
        </span>
      </div>

      <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px]">
        <div className="flex justify-between text-slate-400">
          <span>Feature ID:</span>
          <span className="text-slate-200 font-bold">{feature.id}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Created By:</span>
          <span className="text-emerald-400">{feature.metadata?.createdBy ?? "System"}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Updated At:</span>
          <span className="text-slate-300">{feature.metadata?.updatedAt ?? "Just now"}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Version:</span>
          <span className="text-indigo-300 font-bold">v{feature.metadata?.version ?? 1}</span>
        </div>
      </div>

      <div className="space-y-1">
        <span className="text-slate-400 font-bold block text-[10px]">DYNAMIC ATTRIBUTES:</span>
        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
          {Object.entries(feature.properties).map(([k, v]) => (
            <div key={k} className="p-1.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block uppercase text-[9px]">{k}</span>
              <span className="font-bold text-slate-200">{String(v)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800">
        {onZoom && (
          <button
            onClick={() => onZoom(feature)}
            className="py-1.5 rounded bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600/50 font-bold text-[10px]"
          >
            🎯 Zoom
          </button>
        )}
        {onEdit && (
          <button
            onClick={() => onEdit(feature)}
            className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px]"
          >
            ✏️ Edit
          </button>
        )}
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(feature)}
            className="py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px]"
          >
            📋 Clone
          </button>
        )}
        {onExport && (
          <button
            onClick={() => onExport(feature)}
            className="py-1.5 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50 font-bold text-[10px]"
          >
            📥 Export
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(feature.id)}
            className="py-1.5 rounded bg-red-600/30 text-red-300 border border-red-500/40 hover:bg-red-600/50 font-bold text-[10px]"
          >
            🗑️ Delete
          </button>
        )}
      </div>
    </div>
  );
};
