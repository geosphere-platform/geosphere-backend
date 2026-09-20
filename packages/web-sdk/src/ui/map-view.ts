/**
 * GeoSphere Web SDK — GIS Map View Component & Controller
 */

export interface MapMarker {
  id: string;
  type: "AGENT" | "TASK" | "ASSET";
  title: string;
  lat: number;
  lng: number;
  status: string;
}

export interface MapViewConfig {
  center: [number, number];
  zoom: number;
  markers: MapMarker[];
  showGeofences?: boolean;
}

export class GeoSphereMapController {
  private config: MapViewConfig;

  constructor(config: MapViewConfig) {
    this.config = config;
  }

  public getMarkers(): MapMarker[] {
    return this.config.markers;
  }

  public addMarker(marker: MapMarker): void {
    this.config.markers.push(marker);
  }

  public setZoom(zoom: number): void {
    this.config.zoom = zoom;
  }
}
