import { GeoJSONGeometry, SDKEventEmitter } from "@gis-sdk/core";
import { IMapProvider } from "./map-provider.interface";

export type DrawingMode = "Point" | "LineString" | "Polygon" | "Edit" | "None";

export interface DrawingEventPayload {
  mode: DrawingMode;
  geometry?: GeoJSONGeometry;
  timestamp: string;
}

export class DrawingManager {
  private provider: IMapProvider;
  private activeMode: DrawingMode = "None";
  private activeGeometry: GeoJSONGeometry | null = null;
  private eventBus: SDKEventEmitter = new SDKEventEmitter();

  constructor(provider: IMapProvider) {
    this.provider = provider;
  }

  public startDrawing(mode: DrawingMode): void {
    this.activeMode = mode;
    this.activeGeometry = null;
    this.eventBus.emit("onDrawStart", {
      mode: this.activeMode,
      timestamp: new Date().toISOString(),
    } as DrawingEventPayload);
  }

  public updateDrawing(geometry: GeoJSONGeometry): void {
    this.activeGeometry = geometry;
    this.eventBus.emit("onDrawUpdate", {
      mode: this.activeMode,
      geometry: this.activeGeometry,
      timestamp: new Date().toISOString(),
    } as DrawingEventPayload);
    this.eventBus.emit("onGeometryChanged", {
      mode: this.activeMode,
      geometry: this.activeGeometry,
      timestamp: new Date().toISOString(),
    } as DrawingEventPayload);
  }

  public finishDrawing(): GeoJSONGeometry | null {
    const geometry = this.activeGeometry;
    const mode = this.activeMode;
    this.activeMode = "None";
    this.activeGeometry = null;

    this.eventBus.emit("onDrawComplete", {
      mode,
      geometry,
      timestamp: new Date().toISOString(),
    } as DrawingEventPayload);

    return geometry;
  }

  public cancelDrawing(): void {
    const mode = this.activeMode;
    this.activeMode = "None";
    this.activeGeometry = null;

    this.eventBus.emit("onDrawCancel", {
      mode,
      timestamp: new Date().toISOString(),
    } as DrawingEventPayload);
  }

  public getActiveMode(): DrawingMode {
    return this.activeMode;
  }

  public onDrawStart(cb: (payload: DrawingEventPayload) => void): () => void {
    return this.eventBus.on("onDrawStart", cb);
  }

  public onDrawUpdate(cb: (payload: DrawingEventPayload) => void): () => void {
    return this.eventBus.on("onDrawUpdate", cb);
  }

  public onDrawComplete(
    cb: (payload: DrawingEventPayload) => void,
  ): () => void {
    return this.eventBus.on("onDrawComplete", cb);
  }

  public onDrawCancel(cb: (payload: DrawingEventPayload) => void): () => void {
    return this.eventBus.on("onDrawCancel", cb);
  }

  public onGeometryChanged(
    cb: (payload: DrawingEventPayload) => void,
  ): () => void {
    return this.eventBus.on("onGeometryChanged", cb);
  }
}
