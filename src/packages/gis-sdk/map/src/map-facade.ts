import { IMapProvider, MapOptions } from "./map-provider.interface";
import { OpenLayersAdapter } from "./openlayers-adapter";
import { LayerManager } from "./layer-manager";
import { DrawingManager } from "./drawing-manager";
import { SelectionManager } from "./selection-manager";
import { PopupManager, TooltipManager } from "./popup-tooltip";

export class GISMap {
  private provider: IMapProvider;
  private layerManager: LayerManager;
  private drawingManager: DrawingManager;
  private selectionManager: SelectionManager;
  private popupManager: PopupManager;
  private tooltipManager: TooltipManager;

  constructor(options: MapOptions, provider?: IMapProvider) {
    this.provider = provider || new OpenLayersAdapter();
    this.provider.initialize(options);

    this.layerManager = new LayerManager(this.provider);
    this.drawingManager = new DrawingManager(this.provider);
    this.selectionManager = new SelectionManager();
    this.popupManager = new PopupManager();
    this.tooltipManager = new TooltipManager();
  }

  public getProvider(): IMapProvider {
    return this.provider;
  }

  public getLayers(): LayerManager {
    return this.layerManager;
  }

  public getDrawing(): DrawingManager {
    return this.drawingManager;
  }

  public getSelection(): SelectionManager {
    return this.selectionManager;
  }

  public getPopups(): PopupManager {
    return this.popupManager;
  }

  public getTooltips(): TooltipManager {
    return this.tooltipManager;
  }

  public createVectorTileLayer(layerId: string, tileUrl?: string): void {
    this.layerManager.createLayer({
      id: layerId,
      name: layerId,
      type: "vector-tile",
      url: tileUrl || `/api/v1/tiles/${layerId}/{z}/{x}/{y}`,
      visible: true,
    });
  }

  public addGeoJsonLayer(layerId: string, data: any): void {
    this.layerManager.createLayer({
      id: layerId,
      name: layerId,
      type: "geojson",
      data,
      visible: true,
    });
  }

  public queryViewport(zoom?: number): any {
    const bounds = this.provider.getBounds();
    const currentZoom = zoom ?? this.provider.getZoom();
    return {
      minLng: bounds.minLongitude,
      minLat: bounds.minLatitude,
      maxLng: bounds.maxLongitude,
      maxLat: bounds.maxLatitude,
      zoom: currentZoom,
    };
  }

  public destroy(): void {
    this.provider.destroy();
  }
}
