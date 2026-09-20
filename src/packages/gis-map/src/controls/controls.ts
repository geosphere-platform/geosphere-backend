/**
 * GIS Map SDK — Controls Abstraction
 */

import { MapControlConfig } from "../types";

export interface IControlAdapter {
  setControls(config: MapControlConfig): void;
}

export class MapControlManager {
  private config: MapControlConfig;
  private adapter: IControlAdapter;

  constructor(adapter: IControlAdapter, initialConfig?: MapControlConfig) {
    this.adapter = adapter;
    this.config = {
      zoom: true,
      fullscreen: true,
      scale: true,
      attribution: true,
      ...initialConfig,
    };
  }

  public updateControls(config: Partial<MapControlConfig>): void {
    this.config = { ...this.config, ...config };
    this.adapter.setControls(this.config);
  }

  public getConfig(): MapControlConfig {
    return { ...this.config };
  }
}
