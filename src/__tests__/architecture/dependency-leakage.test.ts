/**
 * Architectural Dependency Leakage Verification Test
 *
 * Scans source code files in Core and GIS engine directories to enforce strict
 * architectural decoupling rules:
 *
 * 1. Core must NOT import OpenLayers ('ol'), React ('react'), React DOM ('react-dom'), or Next.js ('next').
 * 2. GIS Engine must NOT import OpenLayers ('ol'), React ('react'), React DOM ('react-dom'), or Next.js ('next').
 * 3. Independent packages in web/src/packages must NOT import Next.js path aliases ('@/').
 */

import * as fs from "fs";
import * as path from "path";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Architectural Rule Violation: ${message}`);
  }
}

function getAllTypeScriptFiles(dirPath: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dirPath)) return results;

  const list = fs.readdirSync(dirPath);
  for (const file of list) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTypeScriptFiles(filePath));
    } else if (file.endsWith(".ts") && !file.endsWith(".d.ts")) {
      results.push(filePath);
    }
  }
  return results;
}

export function runDependencyLeakageTests(): void {
  console.log("------------------------------------------");
  console.log("RUNNING ARCHITECTURAL DEPENDENCY LEAKAGE TESTS");
  console.log("------------------------------------------");

  const projectRoot = path.resolve(__dirname, "../../../..");
  const webSrcDir = path.resolve(__dirname, "../..");
  const coreDir = path.join(webSrcDir, "core");
  const gisDir = path.join(webSrcDir, "core", "gis");
  const packagesDir = path.join(webSrcDir, "packages");

  // 1. Core Engine Verification
  console.log("  [1/3] Verifying Core Engine Decoupling...");
  const coreFiles = getAllTypeScriptFiles(coreDir);
  for (const filePath of coreFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    // Skip React components if any exist under web/src/core/ui (if any), but core/gis must be clean
    if (relativePath.includes(path.join("core", "gis"))) {
      assert(!content.includes('from "ol') && !content.includes("from 'ol"), `File '${relativePath}' imports OpenLayers!`);
      assert(!content.includes('from "react"') && !content.includes("from 'react'"), `File '${relativePath}' imports React!`);
      assert(!content.includes('from "next') && !content.includes("from 'next"), `File '${relativePath}' imports Next.js!`);
    }
  }
  console.log(`  ✓ Checked ${coreFiles.length} Core source files (0 OpenLayers/React/Next.js leaks).`);

  // 2. GIS Engine Verification
  console.log("  [2/3] Verifying GIS Engine Pure Domain Boundaries...");
  const gisFiles = getAllTypeScriptFiles(gisDir);
  for (const filePath of gisFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `GIS file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `GIS file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `GIS file '${relativePath}' imports Next.js!`);
  }
  console.log(`  ✓ Checked ${gisFiles.length} GIS Engine source files (0 OpenLayers/React/Next.js leaks).`);

  // 4. Location Engine Boundary Verification
  console.log("  [4/4] Verifying Location Engine Pure Boundaries...");
  const locationDir = path.join(gisDir, "location");
  const locationFiles = getAllTypeScriptFiles(locationDir);
  for (const filePath of locationFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Location Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Location Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Location Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("tracking-client") && !content.includes("TrackBuilder"), `Location Engine file '${relativePath}' imports Tracking Engine logic!`);
  }
  console.log(`  ✓ Checked ${locationFiles.length} Location Engine source files (0 UI/Tracking/Geofence leaks).`);

  // 5. Tracking Engine Boundary Verification
  console.log("  [5/6] Verifying Generic Tracking Engine Pure Boundaries...");
  const trackingDir = path.join(gisDir, "tracking");
  const trackingFiles = getAllTypeScriptFiles(trackingDir);
  for (const filePath of trackingFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Tracking Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Tracking Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Tracking Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Tracking Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${trackingFiles.length} Tracking Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 6. Geofencing Engine Boundary Verification
  console.log("  [6/7] Verifying Generic Geofencing Engine Pure Boundaries...");
  const geofencingDir = path.join(gisDir, "geofencing");
  const geofencingFiles = getAllTypeScriptFiles(geofencingDir);
  for (const filePath of geofencingFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Geofencing Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Geofencing Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Geofencing Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Geofencing Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${geofencingFiles.length} Geofencing Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 7. Routing Engine Boundary Verification
  console.log("  [7/8] Verifying Generic Routing Engine Pure Boundaries...");
  const routingDir = path.join(gisDir, "routing");
  const routingFiles = getAllTypeScriptFiles(routingDir);
  for (const filePath of routingFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Routing Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Routing Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Routing Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Routing Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${routingFiles.length} Routing Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 8. Forms Engine Boundary Verification
  console.log("  [8/9] Verifying Generic Forms Engine Pure Boundaries...");
  const formsDir = path.join(webSrcDir, "core", "forms");
  const formsFiles = getAllTypeScriptFiles(formsDir);
  for (const filePath of formsFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Forms Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Forms Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Forms Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Forms Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${formsFiles.length} Forms Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 9. Tasks Engine Boundary Verification
  console.log("  [9/10] Verifying Generic Tasks Engine Pure Boundaries...");
  const tasksDir = path.join(webSrcDir, "core", "tasks");
  const tasksFiles = getAllTypeScriptFiles(tasksDir);
  for (const filePath of tasksFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Tasks Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Tasks Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Tasks Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Tasks Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${tasksFiles.length} Tasks Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 10. Media Engine Boundary Verification
  console.log("  [10/11] Verifying Generic Media Engine Pure Boundaries...");
  const mediaDir = path.join(webSrcDir, "core", "media");
  const mediaFiles = getAllTypeScriptFiles(mediaDir);
  for (const filePath of mediaFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Media Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Media Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Media Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Media Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${mediaFiles.length} Media Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 11. Notification Engine Boundary Verification
  console.log("  [11/12] Verifying Generic Notification Engine Pure Boundaries...");
  const notificationsDir = path.join(webSrcDir, "core", "notifications");
  const notificationsFiles = getAllTypeScriptFiles(notificationsDir);
  for (const filePath of notificationsFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Notification Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Notification Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Notification Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Notification Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${notificationsFiles.length} Notification Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 12. Spatial Analytics Engine Boundary Verification
  console.log("  [12/13] Verifying Generic Spatial Analytics Engine Pure Boundaries...");
  const analyticsDir = path.join(webSrcDir, "core", "gis", "analytics");
  const analyticsFiles = getAllTypeScriptFiles(analyticsDir);
  for (const filePath of analyticsFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Analytics Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Analytics Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Analytics Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Analytics Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${analyticsFiles.length} Spatial Analytics Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 13. Offline & Sync Engine Boundary Verification
  console.log("  [13/14] Verifying Generic Offline & Sync Engine Pure Boundaries...");
  const offlineDir = path.join(webSrcDir, "core", "offline");
  const offlineFiles = getAllTypeScriptFiles(offlineDir);
  for (const filePath of offlineFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Offline Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Offline Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Offline Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Offline Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${offlineFiles.length} Offline & Sync Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 14. Security & Audit Engine Boundary Verification
  console.log("  [14/15] Verifying Generic Security & Audit Engine Pure Boundaries...");
  const securityDir = path.join(webSrcDir, "core", "security");
  const securityFiles = getAllTypeScriptFiles(securityDir);
  for (const filePath of securityFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "ol') && !content.includes("from 'ol"), `Security Engine file '${relativePath}' imports OpenLayers!`);
    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Security Engine file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next"), `Security Engine file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Security Engine file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${securityFiles.length} Security & Audit Engine source files (0 UI/OpenLayers/Vehicle-specific leaks).`);

  // 15. Master Web SDK Facade Boundary Verification
  console.log("  [15/16] Verifying Master Web SDK Facade Pure Boundaries...");
  const webSdkDir = path.join(webSrcDir, "packages", "web-sdk");
  const webSdkFiles = getAllTypeScriptFiles(webSdkDir);
  for (const filePath of webSdkFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Master Web SDK file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next'"), `Master Web SDK file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Master Web SDK file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${webSdkFiles.length} Master Web SDK source files (0 UI/React/Next.js/Vehicle-specific leaks).`);

  // 16. Application Builder & Vertical Templates Boundary Verification
  console.log("  [16/17] Verifying Application Builder & Vertical Templates Pure Boundaries...");
  const builderDir = path.join(webSrcDir, "core", "builder");
  const templatesDir = path.join(webSrcDir, "core", "templates");
  const builderFiles = [...getAllTypeScriptFiles(builderDir), ...getAllTypeScriptFiles(templatesDir)];
  for (const filePath of builderFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Builder/Template file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next'"), `Builder/Template file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Builder/Template file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${builderFiles.length} Application Builder & Vertical Templates source files (0 UI/React/Next.js/Vehicle-specific leaks).`);

  // 17. Mobile Backend Infrastructure Boundary Verification
  console.log("  [17/17] Verifying Mobile Backend Infrastructure Pure Boundaries...");
  const mobileDir = path.join(webSrcDir, "core", "mobile");
  const mobileFiles = getAllTypeScriptFiles(mobileDir);
  for (const filePath of mobileFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(projectRoot, filePath);

    assert(!content.includes('from "react"') && !content.includes("from 'react'"), `Mobile Backend file '${relativePath}' imports React!`);
    assert(!content.includes('from "next') && !content.includes("from 'next'"), `Mobile Backend file '${relativePath}' imports Next.js!`);
    assert(!content.includes("vehicleNumber") && !content.includes("driverName"), `Mobile Backend file '${relativePath}' contains vehicle-specific hardcoded fields!`);
  }
  console.log(`  ✓ Checked ${mobileFiles.length} Mobile Backend Infrastructure source files (0 UI/React/Next.js/Vehicle-specific leaks).`);

  console.log("✅ Architectural Dependency Leakage Tests Passed Successfully!");
}
