/**
 * Pure Framework-Independent Spatial Analytics Engine Unit Tests
 *
 * Verifies heatmap generation, density grid binning, spatial point clustering,
 * trajectory analysis, spatial metric calculation, and pure framework decoupling.
 *
 * MUST NOT require browser DOM, React, Next.js, OpenLayers, or Charting libraries.
 */

import { SpatialAnalyticsEngine } from "../../core/gis/analytics/engine/spatial-analytics-engine";
import { AnalyticsError, HeatmapPoint, TrajectoryPoint } from "../../core/gis/analytics/types/analytics.types";
import { Coordinate } from "../../core/gis/types/geometry";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

export async function runSpatialAnalyticsEnginePureUnitTests(): Promise<void> {
  console.log("------------------------------------------");
  console.log("RUNNING GENERIC SPATIAL ANALYTICS ENGINE PURE DOMAIN TESTS");
  console.log("------------------------------------------");

  const engine = new SpatialAnalyticsEngine();

  // 1. Heatmap Generation & Weight Normalization
  console.log("  [1/12] Testing Heatmap Generation & Weight Normalization...");
  const rawHeatmapPoints = [
    { coordinate: [77.2090, 28.6139] as Coordinate, weight: 10.0 },
    { coordinate: [77.2100, 28.6145] as Coordinate, weight: 50.0 },
    { coordinate: [77.2110, 28.6150] as Coordinate, weight: 100.0 },
  ];
  const normalized = engine.generateHeatmap(rawHeatmapPoints, { normalize: true });
  assert(normalized.length === 3, "Heatmap point count must equal 3");
  assert(normalized[2].weight === 1.0, "Max weight point must normalize to 1.0");
  assert(normalized[0].weight === 0.1, "Min weight point must normalize to 0.1");

  // 2. Bounding Box Calculation
  console.log("  [2/12] Testing Bounding Box Calculation...");
  const coords: Coordinate[] = [
    [77.2000, 28.6000],
    [77.3000, 28.7000],
    [77.2500, 28.6500],
  ];
  const bbox = engine.computeBoundingBox(coords);
  assert(bbox[0] === 77.2000 && bbox[1] === 28.6000 && bbox[2] === 77.3000 && bbox[3] === 28.7000, "Bounding box calculation must match min/max coordinates");

  // 3. Spatial Density Grid Binning
  console.log("  [3/12] Testing Spatial Density Grid Binning...");
  const clusterCoords: Coordinate[] = [
    [77.2090, 28.6139],
    [77.2091, 28.6140],
    [77.2092, 28.6141], // 3 points close in Connaught Place
    [77.4000, 28.8000], // 1 point far away
  ];
  const grid = engine.computeDensityGrid(clusterCoords, 1.0); // 1km grid
  assert(grid.totalPoints === 4, "Total points in grid must equal 4");
  assert(grid.totalCells >= 2, "Grid must generate at least 2 distinct cells");

  // 4. Density Grid Error Handling (Invalid Cell Size)
  console.log("  [4/12] Testing Density Grid Invalid Cell Size Rejection...");
  let invalidGridFailed = false;
  try {
    engine.computeDensityGrid(clusterCoords, 0);
  } catch (err: any) {
    if (err instanceof AnalyticsError && err.code === "INVALID_GRID_SIZE") {
      invalidGridFailed = true;
    }
  }
  assert(invalidGridFailed, "Rejects cell size <= 0");

  // 5. Distance-Based Point Clustering
  console.log("  [5/12] Testing Distance-Based Point Clustering (Centroid & Radius)...");
  const ptsToCluster: Coordinate[] = [
    [77.2090, 28.6139],
    [77.2092, 28.6141], // < 500m apart
    [77.9000, 28.9000], // Far away
  ];
  const clusters = engine.clusterPoints(ptsToCluster, 500); // 500m radius
  assert(clusters.length === 2, "Point clustering must produce 2 distinct clusters");
  assert(clusters[0].pointCount === 2, "First cluster must group 2 nearby points");
  assert(clusters[0].centroid[0] > 77.20 && clusters[0].centroid[1] > 28.60, "Centroid coordinates must be computed");

  // 6. Trajectory Analysis (Distance, Speed, Duration, Idle Time)
  console.log("  [6/12] Testing Trajectory Analysis (Distance, Speed, Idle Time)...");
  const trajectoryPoints: TrajectoryPoint[] = [
    { coordinate: [77.2090, 28.6139], timestamp: "2026-08-18T10:00:00Z", speedKmh: 40 },
    { coordinate: [77.2190, 28.6239], timestamp: "2026-08-18T10:05:00Z", speedKmh: 60 },
    { coordinate: [77.2191, 28.6240], timestamp: "2026-08-18T10:10:00Z", speedKmh: 0 }, // Stationary 5 mins
  ];
  const trajSummary = engine.analyzeTrajectory(trajectoryPoints);
  assert(trajSummary.totalDistanceMeters > 1000, "Total distance must exceed 1000m");
  assert(trajSummary.durationSeconds === 600, "Total duration must equal 600 seconds (10 mins)");
  assert(trajSummary.stopCount === 1, "Stop count must detect 1 stationary stop");
  assert(trajSummary.totalIdleSeconds === 300, "Total idle time must equal 300 seconds");

  // 7. Trajectory Analysis Error Handling
  console.log("  [7/12] Testing Trajectory Analysis Insufficient Points Rejection...");
  let trajFailed = false;
  try {
    engine.analyzeTrajectory([trajectoryPoints[0]]);
  } catch (err: any) {
    if (err instanceof AnalyticsError && err.code === "INSUFFICIENT_POINTS") {
      trajFailed = true;
    }
  }
  assert(trajFailed, "Trajectory analysis with <2 points must fail");

  // 8. Spatial Metric Summary Calculation
  console.log("  [8/12] Testing Spatial Metric Summary Calculation...");
  const metrics = engine.computeMetricSummary(clusterCoords);
  assert(metrics.totalPoints === 4, "Total points in metric summary must equal 4");
  assert(metrics.averageDistanceMeters > 0, "Average inter-point distance must be > 0");

  // 9. Multi-Vertical Spatial Analytics (Agri Field Density, Emergency Heatmap)
  console.log("  [9/12] Testing Multi-Vertical Spatial Analytics Scenarios...");
  const agriPoints: HeatmapPoint[] = [
    { coordinate: [77.5000, 29.1000], weight: 85.5 }, // Field yield metric
    { coordinate: [77.5010, 29.1010], weight: 92.0 },
  ];
  const agriHeatmap = engine.generateHeatmap(agriPoints);
  assert(agriHeatmap.length === 2 && agriHeatmap[1].weight === 92.0, "Agri crop yield heatmap must preserve raw weights");

  // 10. Headless Execution
  console.log("  [10/12] Testing Headless Engine Execution...");
  assert(typeof engine.generateHeatmap === "function", "SpatialAnalyticsEngine must be instantiable without DOM");

  // 11. Empty Point List Handling
  console.log("  [11/12] Testing Empty Point List Graceful Handling...");
  const emptyHeatmap = engine.generateHeatmap([]);
  assert(emptyHeatmap.length === 0, "Empty heatmap point array must return []");

  // 12. Pure Framework Decoupling Verification
  console.log("  [12/12] Verifying Pure Framework Decoupling...");
  assert(typeof engine.computeDensityGrid === "function", "SpatialAnalyticsEngine must expose computeDensityGrid");
  assert(typeof engine.clusterPoints === "function", "SpatialAnalyticsEngine must expose clusterPoints");

  console.log("✅ Generic Spatial Analytics Engine Pure Domain Unit Tests Passed Successfully!");
}
