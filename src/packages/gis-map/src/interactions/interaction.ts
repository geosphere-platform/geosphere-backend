/**
 * GIS Map SDK — Interaction Abstraction
 */

import { MapInteractionType } from "../types";

export interface IInteractionAdapter {
  enableInteraction(type: MapInteractionType): void;
  disableInteraction(type: MapInteractionType): void;
}

export class InteractionManager {
  private activeInteractions: Set<MapInteractionType> = new Set([
    "pan",
    "zoom",
    "select",
    "hover",
  ]);
  private adapter: IInteractionAdapter;

  constructor(adapter: IInteractionAdapter) {
    this.adapter = adapter;
  }

  public enable(type: MapInteractionType): void {
    this.activeInteractions.add(type);
    this.adapter.enableInteraction(type);
  }

  public disable(type: MapInteractionType): void {
    this.activeInteractions.delete(type);
    this.adapter.disableInteraction(type);
  }

  public isEnabled(type: MapInteractionType): boolean {
    return this.activeInteractions.has(type);
  }

  public getActiveInteractions(): MapInteractionType[] {
    return Array.from(this.activeInteractions);
  }
}
