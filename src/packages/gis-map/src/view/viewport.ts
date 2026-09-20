/**
 * GIS Map SDK — Viewport Abstraction
 */

import {
  Coordinate,
  BoundingBoxTuple,
  SpatialReference,
  ViewportState,
} from "../types";
import { MapEventEmitter } from "../events/event-emitter";
import { BoundingBox } from "../../../../core/gis/bbox/bounding-box";

export interface IViewportAdapter {
  getCenter(): Coordinate;
  setCenter(center: Coordinate, animate?: boolean): void;
  getZoom(): number;
  setZoom(zoom: number, animate?: boolean): void;
  getBBox(): BoundingBoxTuple;
  getProjection(): SpatialReference;
  fitExtent(bbox: BoundingBoxTuple | BoundingBox, padding?: number): void;
}

export class Viewport {
  private adapter: IViewportAdapter;
  private emitter: MapEventEmitter;

  constructor(adapter: IViewportAdapter, emitter: MapEventEmitter) {
    this.adapter = adapter;
    this.emitter = emitter;
  }

  public getCenter(): Coordinate {
    return this.adapter.getCenter();
  }

  public setCenter(center: Coordinate, animate: boolean = true): void {
    this.adapter.setCenter(center, animate);
    this.emitter.emit("centerChanged", { center });
    this.emitViewportChanged();
  }

  public getZoom(): number {
    return this.adapter.getZoom();
  }

  public setZoom(zoom: number, animate: boolean = true): void {
    this.adapter.setZoom(zoom, animate);
    this.emitter.emit("zoomChanged", { zoom });
    this.emitViewportChanged();
  }

  public getBBox(): BoundingBoxTuple {
    return this.adapter.getBBox();
  }

  public getProjection(): SpatialReference {
    return this.adapter.getProjection();
  }

  public fitExtent(
    bbox: BoundingBoxTuple | BoundingBox,
    padding: number = 40,
  ): void {
    this.adapter.fitExtent(bbox, padding);
    this.emitViewportChanged();
  }

  public getState(): ViewportState {
    return {
      center: this.getCenter(),
      zoom: this.getZoom(),
      bbox: this.getBBox(),
      projection: this.getProjection(),
    };
  }

  private emitViewportChanged(): void {
    this.emitter.emit("viewportChanged", this.getState());
  }
}
