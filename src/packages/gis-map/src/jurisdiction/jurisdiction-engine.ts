/**
 * GeoSphere Maps SDK — Generic Jurisdiction & Boundary System
 *
 * Provides provider-agnostic, multi-level hierarchical boundary management.
 * Supports: Country → State/Region → District/Area → Sub-District → Local Area → Custom Territory
 */

import { BoundingBoxTuple, Coordinate, MapFeature } from "../types";

export type JurisdictionLevel =
  | "COUNTRY"
  | "STATE_REGION"
  | "DISTRICT_AREA"
  | "SUB_DISTRICT"
  | "LOCAL_AREA"
  | "CUSTOM_TERRITORY";

export interface JurisdictionNode {
  id: string;
  code: string;
  name: string;
  level: JurisdictionLevel;
  parentId?: string;
  boundaryGeometry?: any; // GeoJSON Polygon / MultiPolygon
  bbox?: BoundingBoxTuple;
  center?: Coordinate;
  authorizedRoleIds?: string[];
  assignedAgentIds?: string[];
  metadata?: Record<string, unknown>;
  children?: JurisdictionNode[];
}

export interface JurisdictionFilterOptions {
  activeLevel?: JurisdictionLevel;
  selectedIds?: string[];
  searchQuery?: string;
  onlyAuthorizedForUser?: string; // UserId / RoleId check
}

export class JurisdictionEngine {
  private rootNodes: JurisdictionNode[] = [];
  private nodesMap: Map<string, JurisdictionNode> = new Map();
  private selectedIds: Set<string> = new Set();
  private activeJurisdictionId: string | null = null;

  constructor(initialData?: JurisdictionNode[]) {
    if (initialData) {
      this.loadJurisdictions(initialData);
    }
  }

  public loadJurisdictions(nodes: JurisdictionNode[]): void {
    this.rootNodes = nodes;
    this.nodesMap.clear();
    const indexNode = (node: JurisdictionNode) => {
      this.nodesMap.set(node.id, node);
      if (node.children) {
        node.children.forEach(indexNode);
      }
    };
    nodes.forEach(indexNode);
  }

  public getRootNodes(): JurisdictionNode[] {
    return this.rootNodes;
  }

  public getNodeById(id: string): JurisdictionNode | undefined {
    return this.nodesMap.get(id);
  }

  public selectJurisdiction(id: string, multiSelect: boolean = false): void {
    if (!multiSelect) {
      this.selectedIds.clear();
    }
    if (this.nodesMap.has(id)) {
      this.selectedIds.add(id);
      this.activeJurisdictionId = id;
    }
  }

  public deselectJurisdiction(id: string): void {
    this.selectedIds.delete(id);
    if (this.activeJurisdictionId === id) {
      const remaining = Array.from(this.selectedIds);
      this.activeJurisdictionId = remaining.length > 0 ? remaining[remaining.length - 1] : null;
    }
  }

  public clearSelection(): void {
    this.selectedIds.clear();
    this.activeJurisdictionId = null;
  }

  public getSelectedNodes(): JurisdictionNode[] {
    return Array.from(this.selectedIds)
      .map((id) => this.nodesMap.get(id))
      .filter((node): node is JurisdictionNode => node !== undefined);
  }

  public getActiveJurisdiction(): JurisdictionNode | undefined {
    return this.activeJurisdictionId ? this.nodesMap.get(this.activeJurisdictionId) : undefined;
  }

  public filterJurisdictions(options: JurisdictionFilterOptions): JurisdictionNode[] {
    const results: JurisdictionNode[] = [];
    const query = options.searchQuery?.toLowerCase().trim();

    this.nodesMap.forEach((node) => {
      if (options.activeLevel && node.level !== options.activeLevel) return;
      if (options.selectedIds && !options.selectedIds.includes(node.id)) return;
      if (query && !node.name.toLowerCase().includes(query) && !node.code.toLowerCase().includes(query)) return;
      if (options.onlyAuthorizedForUser) {
        if (node.assignedAgentIds && !node.assignedAgentIds.includes(options.onlyAuthorizedForUser)) {
          return;
        }
      }
      results.push(node);
    });

    return results;
  }

  public calculateBoundingBox(nodeId: string): BoundingBoxTuple | null {
    const node = this.nodesMap.get(nodeId);
    if (!node) return null;
    if (node.bbox) return node.bbox;
    if (node.center) {
      const [lng, lat] = node.center;
      return [lng - 0.05, lat - 0.05, lng + 0.05, lat + 0.05];
    }
    return null;
  }

  public toMapFeatures(): MapFeature[] {
    const features: MapFeature[] = [];
    this.selectedIds.forEach((id) => {
      const node = this.nodesMap.get(id);
      if (node && node.center) {
        features.push({
          id: `jurisdiction_${node.id}`,
          geometry: node.boundaryGeometry || {
            type: "Point",
            coordinates: node.center,
          },
          properties: {
            jurisdictionId: node.id,
            code: node.code,
            name: node.name,
            level: node.level,
          },
          style: {
            fillColor: "rgba(99, 102, 241, 0.15)",
            strokeColor: "#6366f1",
            strokeWidth: 2.5,
            label: `${node.name} (${node.level})`,
          },
        });
      }
    });
    return features;
  }
}
