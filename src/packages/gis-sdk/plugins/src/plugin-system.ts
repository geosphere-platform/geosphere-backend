import { GISSDK } from "@gis-sdk/core";

export interface GISPlugin {
  name: string;
  version: string;
  install(sdk: GISSDK): void;
  destroy?(): void;
}

export class PluginManager {
  private static plugins: Map<string, GISPlugin> = new Map();

  public static registerPlugin(plugin: GISPlugin, sdk?: GISSDK): void {
    const sdkInstance = sdk || GISSDK.getInstance();
    if (this.plugins.has(plugin.name)) {
      console.warn(
        `Plugin '${plugin.name}' is already registered. Overwriting.`,
      );
      this.plugins.get(plugin.name)?.destroy?.();
    }

    plugin.install(sdkInstance);
    this.plugins.set(plugin.name, plugin);
    sdkInstance
      .getLogger()
      .info(`Registered GIS Plugin: ${plugin.name} v${plugin.version}`);
  }

  public static unregisterPlugin(name: string): void {
    const plugin = this.plugins.get(name);
    if (plugin) {
      plugin.destroy?.();
      this.plugins.delete(name);
    }
  }

  public static getPlugin<T extends GISPlugin = GISPlugin>(
    name: string,
  ): T | undefined {
    return this.plugins.get(name) as T | undefined;
  }

  public static listPlugins(): { name: string; version: string }[] {
    return Array.from(this.plugins.values()).map((p) => ({
      name: p.name,
      version: p.version,
    }));
  }
}
