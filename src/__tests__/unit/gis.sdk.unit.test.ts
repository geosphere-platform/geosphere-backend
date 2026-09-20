/**
 * GIS Map SDK — Unit Tests
 */

import {
  GISMap,
  createMapOptions,
  Viewport,
  LayerManager,
  FeatureManager,
  SelectionManager,
  VectorLayer,
  TileLayer,
  ClusterLayer,
  HeatmapLayer,
  createMapFeature,
  createFeatureStyle,
  MeasurementEngine,
  createPointClusterOptions,
  createHeatmapOptions,
  StaticMapDataSource,
  MapEventEmitter,
} from "@gis/map";

export function runGisSdkUnitTests(): boolean {
  // 1. Map Configuration Test
  const opts = createMapOptions({ zoom: 15, baseTile: "carto_dark" });
  if (opts.zoom !== 15 || opts.baseTile !== "carto_dark") {
    throw new Error("MapOptions configuration test failed");
  }

  // 2. Feature Creation & Validation Test
  const feat = createMapFeature(
    "feat-1",
    { type: "Point", coordinates: [73.8567, 18.5204] },
    { name: "Pune Central" },
    createFeatureStyle({ fillColor: "#ff0000" }),
  );
  if (feat.id !== "feat-1" || feat.style?.fillColor !== "#ff0000") {
    throw new Error("MapFeature creation test failed");
  }

  // 3. Feature Manager & Bulk Operations Test
  const emitter = new MapEventEmitter();
  const fm = new FeatureManager(emitter);

  let addedCount = 0;
  emitter.on("featureAdded", () => {
    addedCount++;
  });

  fm.addFeature(feat);
  if (!fm.getFeature("feat-1") || addedCount !== 1) {
    throw new Error("FeatureManager addFeature test failed");
  }

  fm.addFeatures([
    createMapFeature("feat-2", {
      type: "Point",
      coordinates: [72.8777, 19.076],
    }),
    createMapFeature("feat-3", {
      type: "Point",
      coordinates: [77.209, 28.6139],
    }),
  ]);
  if (fm.getFeatures().length !== 3) {
    throw new Error("FeatureManager bulk addFeatures test failed");
  }

  fm.removeFeature("feat-2");
  if (fm.getFeatures().length !== 2) {
    throw new Error("FeatureManager removeFeature test failed");
  }

  fm.clearFeatures();
  if (fm.getFeatures().length !== 0) {
    throw new Error("FeatureManager clearFeatures test failed");
  }

  // 4. Layer Manager Test
  const mockAdapter: any = {
    addLayer: () => {},
    removeLayer: () => {},
    setLayerVisibility: () => {},
    setLayerOpacity: () => {},
    setLayerZIndex: () => {},
  };
  const lm = new LayerManager(mockAdapter, emitter);

  const vecLayer = new VectorLayer({
    id: "v1",
    name: "Vector Layer 1",
    zIndex: 5,
  });
  const tileLayer = new TileLayer({
    id: "t1",
    name: "Tile Layer 1",
    zIndex: 1,
  });

  lm.addLayer(vecLayer);
  lm.addLayer(tileLayer);

  const layers = lm.getLayers();
  if (layers[0].id !== "t1" || layers[1].id !== "v1") {
    throw new Error("LayerManager ordering test failed");
  }

  lm.hideLayer("v1");
  if (lm.getLayer("v1")?.visible !== false) {
    throw new Error("LayerManager visibility toggle test failed");
  }

  // 5. Geospatial Measurement Engine Test (Distance & Area)
  // Distance between Pune [73.8567, 18.5204] and Mumbai [72.8777, 19.0760] ~ 120-130 km
  const dist = MeasurementEngine.measureDistance(
    [
      [73.8567, 18.5204],
      [72.8777, 19.076],
    ],
    "kilometers",
  );
  if (dist.value < 100 || dist.value > 150) {
    throw new Error(
      `Geodesic distance calculation failed: got ${dist.value} km`,
    );
  }

  // Area of square polygon [0,0], [1,0], [1,1], [0,1], [0,0] ~ 12,300 sq km
  const area = MeasurementEngine.measureArea(
    [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
    "squareKilometers",
  );
  if (area.value < 10000 || area.value > 15000) {
    throw new Error(
      `Spherical area calculation failed: got ${area.value} sq km`,
    );
  }

  // 6. Cluster & Heatmap Configuration Test
  const clusterOpts = createPointClusterOptions({
    distance: 50,
    minClusterSize: 3,
  });
  if (clusterOpts.distance !== 50 || clusterOpts.minClusterSize !== 3) {
    throw new Error("PointCluster options test failed");
  }

  const heatmapOpts = createHeatmapOptions({ radius: 25, blur: 20 });
  if (heatmapOpts.radius !== 25 || heatmapOpts.blur !== 20) {
    throw new Error("Heatmap options test failed");
  }

  // 7. Static Data Source Test
  const ds = new StaticMapDataSource("ds-1", "Sample Data Source", [feat]);
  if (ds.getFeatures().length !== 1 || ds.id !== "ds-1") {
    throw new Error("StaticMapDataSource test failed");
  }

  return true;
}
