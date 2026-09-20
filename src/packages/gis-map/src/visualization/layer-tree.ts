/**
 * Visualization Engine — Layer Tree Model
 *
 * Business-agnostic layer tree representation supporting nested layer groups,
 * visibility hierarchy, ordering, and tree updates.
 */

import { GISLayerDefinition, LayerGroup } from "./types";

export interface LayerTreeNode {
  id: string;
  name: string;
  type: "group" | "layer";
  visible: boolean;
  order: number;
  data?: GISLayerDefinition | LayerGroup;
  children?: LayerTreeNode[];
}

export class LayerTreeManager {
  private groups: Map<string, LayerGroup> = new Map();
  private layers: Map<string, GISLayerDefinition> = new Map();

  constructor(groups: LayerGroup[] = [], layers: GISLayerDefinition[] = []) {
    groups.forEach((g) => this.groups.set(g.id, { ...g }));
    layers.forEach((l) => this.layers.set(l.id, { ...l }));
  }

  public setGroup(group: LayerGroup): void {
    this.groups.set(group.id, group);
  }

  public setLayer(layer: GISLayerDefinition): void {
    this.layers.set(layer.id, layer);
  }

  public removeGroup(groupId: string): void {
    this.groups.delete(groupId);
  }

  public removeLayer(layerId: string): void {
    this.layers.delete(layerId);
  }

  /**
   * Build hierarchical LayerTree representation.
   */
  public buildTree(): LayerTreeNode[] {
    const rootNodes: LayerTreeNode[] = [];

    // Map top-level groups
    const groupArray = Array.from(this.groups.values()).sort(
      (a, b) => a.order - b.order,
    );
    const groupNodeMap = new Map<string, LayerTreeNode>();

    for (const group of groupArray) {
      const node: LayerTreeNode = {
        id: group.id,
        name: group.name,
        type: "group",
        visible: group.visible,
        order: group.order,
        data: group,
        children: [],
      };
      groupNodeMap.set(group.id, node);
    }

    // Connect nested groups
    for (const group of groupArray) {
      const node = groupNodeMap.get(group.id)!;
      if (group.parentId && groupNodeMap.has(group.parentId)) {
        groupNodeMap.get(group.parentId)!.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    // Attach layers
    const layerArray = Array.from(this.layers.values()).sort(
      (a, b) => a.zIndex - b.zIndex,
    );
    for (const layer of layerArray) {
      const node: LayerTreeNode = {
        id: layer.id,
        name: layer.name,
        type: "layer",
        visible: layer.visible,
        order: layer.zIndex,
        data: layer,
      };

      if (layer.groupId && groupNodeMap.has(layer.groupId)) {
        groupNodeMap.get(layer.groupId)!.children!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    return rootNodes;
  }

  /**
   * Toggle visibility of a group and recursively propagate to child groups and layers.
   */
  public toggleGroupVisibility(
    groupId: string,
    visible: boolean,
  ): Array<{ layerId: string; visible: boolean }> {
    const group = this.groups.get(groupId);
    if (!group) return [];

    group.visible = visible;
    const affectedLayers: Array<{ layerId: string; visible: boolean }> = [];

    // Update child groups
    for (const g of this.groups.values()) {
      if (g.parentId === groupId) {
        this.toggleGroupVisibility(g.id, visible);
      }
    }

    // Update child layers
    for (const l of this.layers.values()) {
      if (l.groupId === groupId) {
        l.visible = visible;
        affectedLayers.push({ layerId: l.id, visible });
      }
    }

    return affectedLayers;
  }
}
