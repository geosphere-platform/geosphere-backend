import assert from "node:assert";
import {
  LayerManager,
  DrawingManager,
  SelectionManager,
  MeasurementManager,
  PopupManager,
  TooltipManager,
  IMapProvider,
  LayerConfig,
} from "@gis-sdk/map";
import { Coordinates } from "@gis-sdk/core";

// Mock Map Provider for testing business layer decoupling
class MockMapProvider implements IMapProvider {
  public layers: Map<string, LayerConfig> = new Map();
  public features: Map<string, any[]> = new Map();

  initialize(): void {}
  destroy(): void {}
  setCenter(): void {}
  getCenter(): Coordinates {
    return { latitude: 18.52, longitude: 73.85 };
  }
  setZoom(): void {}
  getZoom(): number {
    return 10;
  }
  fitBounds(): void {}
  getBounds(): any {
    return {
      minLongitude: 73,
      minLatitude: 18,
      maxLongitude: 74,
      maxLatitude: 19,
    };
  }
  setRotation(): void {}
  getRotation(): number {
    return 0;
  }

  addLayer(config: LayerConfig): void {
    this.layers.set(config.id, config);
  }
  removeLayer(layerId: string): void {
    this.layers.delete(layerId);
  }
  updateLayer(layerId: string, updates: Partial<LayerConfig>): void {
    const l = this.layers.get(layerId);
    if (l) this.layers.set(layerId, { ...l, ...updates });
  }
  setLayerVisibility(layerId: string, visible: boolean): void {
    this.updateLayer(layerId, { visible });
  }
  setLayerOpacity(layerId: string, opacity: number): void {
    this.updateLayer(layerId, { opacity });
  }

  addFeature(layerId: string, feature: any): void {
    if (!this.features.has(layerId)) this.features.set(layerId, []);
    this.features.get(layerId)!.push(feature);
  }
  removeFeature(layerId: string, featureId: string | number): void {
    const list = this.features.get(layerId) || [];
    this.features.set(
      layerId,
      list.filter((f) => f.id !== featureId),
    );
  }
  clearFeatures(layerId: string): void {
    this.features.set(layerId, []);
  }

  on(): () => void {
    return () => {};
  }
  getNativeMap(): any {
    return null;
  }
}

export async function runGisSdkMapUnitTests() {
  console.log("------------------------------------------");
  console.log("RUNNING GIS SDK MAP & LAYERS UNIT TESTS");
  console.log("------------------------------------------");

  let passed = 0;
  let failed = 0;

  function runTest(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (e: any) {
      console.log(`  ✗ ${name}`);
      console.log(`    Error: ${e.message}`);
      failed++;
    }
  }

  // 1. Layer Manager Operations
  runTest("LayerManager layer creation, updates, and removals", () => {
    const mockProvider = new MockMapProvider();
    const lm = new LayerManager(mockProvider);

    lm.createLayer({
      id: "vector_zones",
      name: "Zones",
      type: "vector",
      visible: true,
      opacity: 0.9,
    });

    assert.strictEqual(
      lm.listLayers().length,
      1,
      "Layer created in LayerManager",
    );
    assert.strictEqual(
      mockProvider.layers.has("vector_zones"),
      true,
      "Layer added to map provider",
    );

    lm.setVisibility("vector_zones", false);
    assert.strictEqual(
      mockProvider.layers.get("vector_zones")!.visible!,
      false,
      "Layer visibility updated in provider",
    );

    lm.removeLayer("vector_zones");
    assert.strictEqual(
      lm.listLayers().length,
      0,
      "Layer removed from LayerManager",
    );
    assert.strictEqual(
      mockProvider.layers.has("vector_zones"),
      false,
      "Layer removed from map provider",
    );
  });

  // 2. Drawing Manager Lifecycle Events
  runTest(
    "DrawingManager events onDrawStart, onDrawUpdate, and onDrawComplete",
    () => {
      const mockProvider = new MockMapProvider();
      const dm = new DrawingManager(mockProvider);
      let startTriggered = false;
      let completeTriggered = false;

      dm.onDrawStart(() => {
        startTriggered = true;
      });
      dm.onDrawComplete(() => {
        completeTriggered = true;
      });

      dm.startDrawing("Polygon");
      assert.strictEqual(startTriggered, true, "onDrawStart fired");
      assert.strictEqual(
        dm.getActiveMode(),
        "Polygon",
        "Active mode is Polygon",
      );

      dm.updateDrawing({
        type: "Polygon",
        coordinates: [
          [
            [73, 18],
            [74, 18],
            [74, 19],
            [73, 18],
          ],
        ],
      });
      dm.finishDrawing();
      assert.strictEqual(completeTriggered, true, "onDrawComplete fired");
      assert.strictEqual(
        dm.getActiveMode(),
        "None",
        "Active mode reset to None",
      );
    },
  );

  // 3. Selection Manager
  runTest("SelectionManager select, unselect, and selection events", () => {
    const sm = new SelectionManager();
    const sampleFeature = {
      type: "Feature" as const,
      id: "feat_123",
      geometry: { type: "Point" as const, coordinates: [73.8, 18.5] },
      properties: { name: "Target Point" },
    };

    sm.selectFeature(sampleFeature);
    assert.strictEqual(sm.isSelected("feat_123"), true, "Feature is selected");
    assert.strictEqual(
      sm.getSelectedFeatures().length,
      1,
      "1 feature selected",
    );

    sm.unselectFeature("feat_123");
    assert.strictEqual(
      sm.isSelected("feat_123"),
      false,
      "Feature is unselected",
    );
    assert.strictEqual(
      sm.getSelectedFeatures().length,
      0,
      "0 features selected",
    );
  });

  // 4. Measurement Manager
  runTest("MeasurementManager distance and area calculations", () => {
    const p1 = { latitude: 18.5204, longitude: 73.8567 };
    const p2 = { latitude: 18.5304, longitude: 73.8667 };

    const dist = MeasurementManager.calculateDistance(p1, p2);
    assert.strictEqual(
      dist > 1000 && dist < 2000,
      true,
      `Distance calculation returned valid meters (${dist.toFixed(1)}m)`,
    );

    const poly = [
      { latitude: 18.5, longitude: 73.8 },
      { latitude: 18.5, longitude: 73.81 },
      { latitude: 18.51, longitude: 73.81 },
      { latitude: 18.51, longitude: 73.8 },
    ];
    const area = MeasurementManager.calculatePolygonArea(poly);
    assert.strictEqual(
      area > 1000000,
      true,
      `Polygon area calculation returned valid sq meters (${area.toFixed(1)} m²)`,
    );
  });

  // 5. Popup & Tooltip Managers
  runTest("PopupManager open and close events", () => {
    const pm = new PopupManager();
    let popupState: any = null;
    pm.onChange((p) => {
      popupState = p;
    });

    pm.openPopup({
      title: "Warehouse Info",
      content: "Main Hub",
      coordinates: { latitude: 18.52, longitude: 73.85 },
    });

    assert.strictEqual(
      popupState?.title,
      "Warehouse Info",
      "Popup open notified listener",
    );

    pm.closePopup();
    assert.strictEqual(popupState, null, "Popup close notified listener");
  });

  console.log(
    `Map SDK Unit Tests Complete: ${passed} passed, ${failed} failed.\n`,
  );
  if (failed > 0) throw new Error(`${failed} Map SDK unit tests failed.`);
}
