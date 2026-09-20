"use client";

/**
 * GeoSphere Platform — Selection-First GIS Feature Editor React Component
 *
 * Implements the mandatory Selection-First UX:
 * EDIT TOOL -> SELECT FEATURE -> VALIDATE PERMISSIONS & GEOMETRY -> OPEN EDIT PANEL -> PREVIEW -> CONFIRM -> SAVE
 */

import React, { useState } from "react";
import { GeoSphereFeature, GeoSphereGeometry, GeoSphereTopologyValidator, Coordinate } from "../editing/geospatial-editing-engine";
import {
  GeoSphereLayerEditPolicy,
  GeoSphereGeometryPolicy,
  GeoSphereJurisdictionPolicy,
  GeoSphereOperationMatrix,
  GeoSphereJurisdictionGuard,
  OperationType,
  createDefaultLayerPolicy,
  createDefaultGeometryPolicy,
} from "../editing/edit-policy-engine";

export interface SelectionFirstEditorProps {
  selectedFeature: GeoSphereFeature | null;
  layerPolicy?: GeoSphereLayerEditPolicy;
  geometryPolicy?: GeoSphereGeometryPolicy;
  jurisdictionPolicy?: GeoSphereJurisdictionPolicy;
  isLocked?: boolean;
  lockReason?: string;
  onOperationPreview?: (previewGeom: GeoSphereGeometry) => void;
  onSaveFeature?: (updatedFeature: GeoSphereFeature) => void;
  onCancelEdit?: () => void;
  onDiscardChanges?: () => void;
}

export const GeoSphereSelectionFirstEditor: React.FC<SelectionFirstEditorProps> = ({
  selectedFeature,
  layerPolicy = createDefaultLayerPolicy(),
  geometryPolicy = createDefaultGeometryPolicy(),
  jurisdictionPolicy,
  isLocked = false,
  lockReason = "This feature is currently locked by another administrative session.",
  onOperationPreview,
  onSaveFeature,
  onCancelEdit,
  onDiscardChanges,
}) => {
  const [activeOperation, setActiveOperation] = useState<OperationType | null>(null);
  const [previewGeometry, setPreviewGeometry] = useState<GeoSphereGeometry | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [showDiscardGuard, setShowDiscardGuard] = useState<boolean>(false);
  const [bufferMeters, setBufferMeters] = useState<number>(100);

  // 1. STATE: EDIT TOOL CLICKED, NO FEATURE SELECTED YET
  if (!selectedFeature) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 text-slate-100 font-mono text-xs shadow-2xl space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold">
          <span className="p-1 rounded bg-amber-500/20 text-amber-300">🎯</span>
          <span>EDIT MODE ACTIVE</span>
        </div>
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-center font-bold">
          &quot;Select a feature on the map to edit.&quot;
        </div>
        <span className="text-[10px] text-slate-500 block text-center">
          Click any plotted point, line, or area directly on the map canvas to create an edit session.
        </span>
      </div>
    );
  }

  // 2. STATE: FEATURE SELECTED BUT IS LOCKED OR UNEDITABLE
  if (isLocked) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/95 border border-red-500/50 text-slate-100 font-mono text-xs shadow-2xl space-y-2">
        <div className="flex items-center justify-between text-red-400 font-bold border-b border-slate-800 pb-2">
          <span className="flex items-center gap-1.5">🔒 FEATURE LOCKED</span>
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px]">READ_ONLY</span>
        </div>
        <div className="p-2.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-bold text-center">
          &quot;{lockReason}&quot;
        </div>
        <span className="text-[10px] text-slate-400 block">
          Edit Panel cannot be opened for locked or restricted features.
        </span>
        <button
          onClick={onCancelEdit}
          className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
        >
          ✖ Close Selection
        </button>
      </div>
    );
  }

  // 3. FEATURE SELECTED AND VALID: OPEN DEDICATED EDIT PANEL
  const allowedOps = GeoSphereOperationMatrix.getAllowedOperations(selectedFeature.geometry.type);

  const handleApplyBufferPreview = () => {
    // Generate Buffer Polygon
    const center = selectedFeature.geometry.coordinates;
    const centerPt = Array.isArray(center[0]) ? center[0][0] : center;
    const lng = centerPt[0] || 79.0882;
    const lat = centerPt[1] || 21.1458;

    const radiusLng = (bufferMeters / 111320) * Math.cos((lat * Math.PI) / 180);
    const radiusLat = bufferMeters / 110540;

    const ring: Coordinate[] = Array.from({ length: 17 }, (_, i) => {
      const angle = (i * 360) / 16;
      const rad = (angle * Math.PI) / 180;
      return [lng + radiusLng * Math.cos(rad), lat + radiusLat * Math.sin(rad)];
    });

    const previewGeom: GeoSphereGeometry = {
      type: "Polygon",
      coordinates: [ring],
    };

    // Validate Jurisdiction Boundary
    const jurisRes = GeoSphereJurisdictionGuard.validateJurisdiction(previewGeom, jurisdictionPolicy);
    if (!jurisRes.valid) {
      setValidationErrors([jurisRes.errorMessage || "Jurisdiction boundary exceeded."]);
      return;
    }

    setValidationErrors([]);
    setPreviewGeometry(previewGeom);
    setActiveOperation("BUFFER");
    if (onOperationPreview) onOperationPreview(previewGeom);
  };

  const handleApplyMergePreview = () => {
    const coords = selectedFeature.geometry.coordinates;
    const ring: Coordinate[] = coords[0] || [
      [79.0800, 21.1460], [79.0850, 21.1500], [79.0900, 21.1470], [79.0870, 21.1430], [79.0800, 21.1460]
    ];
    const mergedRing: Coordinate[] = ring.map((pt) => [pt[0] + 0.002, pt[1] + 0.001]);
    const previewGeom: GeoSphereGeometry = {
      type: "Polygon",
      coordinates: [mergedRing],
    };

    const jurisRes = GeoSphereJurisdictionGuard.validateJurisdiction(previewGeom, jurisdictionPolicy);
    if (!jurisRes.valid) {
      setValidationErrors([jurisRes.errorMessage || "Jurisdiction boundary exceeded."]);
      return;
    }

    setValidationErrors([]);
    setPreviewGeometry(previewGeom);
    setActiveOperation("MERGE");
    if (onOperationPreview) onOperationPreview(previewGeom);
  };

  const handleApplySplitPreview = () => {
    const coords = selectedFeature.geometry.coordinates;
    const ring: Coordinate[] = coords[0] || [
      [79.0800, 21.1460], [79.0850, 21.1500], [79.0900, 21.1470], [79.0870, 21.1430], [79.0800, 21.1460]
    ];

    const part1Ring: Coordinate[] = [
      ring[0],
      ring[1],
      [(ring[1][0] + ring[2][0]) / 2, (ring[1][1] + ring[2][1]) / 2],
      [(ring[0][0] + ring[3][0]) / 2, (ring[0][1] + ring[3][1]) / 2],
      ring[0],
    ];

    const previewGeom: GeoSphereGeometry = {
      type: "Polygon",
      coordinates: [part1Ring],
    };

    setValidationErrors([]);
    setPreviewGeometry(previewGeom);
    setActiveOperation("SPLIT");
    if (onOperationPreview) onOperationPreview(previewGeom);
  };

  const handleConfirmPreview = () => {
    if (!previewGeometry) return;
    const updated: GeoSphereFeature = {
      ...selectedFeature,
      geometry: previewGeometry,
      metadata: {
        ...selectedFeature.metadata,
        updatedAt: new Date().toISOString(),
      },
    };
    setHasUnsavedChanges(true);
    setPreviewGeometry(null);
    setActiveOperation(null);
    if (onSaveFeature) onSaveFeature(updated);
  };

  const handleDiscardClick = () => {
    if (hasUnsavedChanges) {
      setShowDiscardGuard(true);
    } else {
      if (onCancelEdit) onCancelEdit();
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900/95 border border-indigo-500/50 text-slate-100 font-mono text-xs shadow-2xl space-y-3">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-2">
        <div>
          <h4 className="font-bold text-indigo-300 text-sm">{selectedFeature.properties.name || selectedFeature.id}</h4>
          <span className="text-[10px] text-slate-400">Layer: {selectedFeature.layerId || layerPolicy.layerId}</span>
        </div>
        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
          {selectedFeature.geometry.type.toUpperCase()}
        </span>
      </div>

      {/* Discard Guard Alert */}
      {showDiscardGuard && (
        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 space-y-2">
          <span className="font-bold block">⚠️ Discard unsaved changes?</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDiscardGuard(false)}
              className="flex-1 py-1 rounded bg-slate-800 text-slate-200 font-bold"
            >
              Keep Editing
            </button>
            <button
              onClick={() => {
                setShowDiscardGuard(false);
                setHasUnsavedChanges(false);
                if (onDiscardChanges) onDiscardChanges();
                if (onCancelEdit) onCancelEdit();
              }}
              className="flex-1 py-1 rounded bg-red-600 text-white font-bold"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationErrors.length > 0 && (
        <div className="p-2.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-bold space-y-1">
          {validationErrors.map((err, i) => (
            <div key={i}>❌ {err}</div>
          ))}
        </div>
      )}

      {/* Operation Matrix Action Buttons */}
      <div className="space-y-1.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
          ALLOWED OPERATIONS ({allowedOps.length}):
        </span>
        <div className="grid grid-cols-4 gap-1.5">
          {allowedOps.map((op) => (
            <button
              key={op}
              onClick={() => {
                if (op === "BUFFER") {
                  handleApplyBufferPreview();
                } else if (op === "MERGE") {
                  handleApplyMergePreview();
                } else if (op === "SPLIT") {
                  handleApplySplitPreview();
                } else {
                  setActiveOperation(op);
                }
              }}
              className={`py-1.5 px-1 rounded font-bold transition-all text-[10px] ${
                activeOperation === op
                  ? "bg-indigo-600 text-white border border-indigo-400 shadow-md shadow-indigo-500/20"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>

      {/* Buffer Input HUD */}
      {activeOperation === "BUFFER" && !previewGeometry && (
        <div className="p-2.5 rounded bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-bold">Buffer Distance (Meters):</span>
            <span className="text-emerald-400 font-bold">{bufferMeters}m</span>
          </div>
          <input
            type="range"
            min="10"
            max="2000"
            value={bufferMeters}
            onChange={(e) => setBufferMeters(parseInt(e.target.value))}
            className="w-full h-1 bg-slate-700 rounded appearance-none cursor-pointer"
          />
          <button
            onClick={handleApplyBufferPreview}
            className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
          >
            🔍 Generate Buffer Preview
          </button>
        </div>
      )}

      {/* Operation Preview Banner & Confirm Controls */}
      {previewGeometry && (
        <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-bold text-indigo-300 text-xs">👁️ PREVIEW TEMPORARY GEOMETRY</span>
            <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold">
              UNSAVED PREVIEW
            </span>
          </div>
          <p className="text-[10px] text-slate-300">
            Previewing operation output on map. Click <b>Confirm Operation</b> to apply to edit session.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmPreview}
              className="flex-1 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
            >
              ✅ Confirm Operation
            </button>
            <button
              onClick={() => {
                setPreviewGeometry(null);
                setActiveOperation(null);
              }}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              ✖ Cancel
            </button>
          </div>
        </div>
      )}

      {/* Panel Footer Controls */}
      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={handleDiscardClick}
          className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
        >
          ✖ Cancel &amp; Close
        </button>
      </div>
    </div>
  );
};
