/**
 * Master GeoSphere Web SDK (@geosphere/web-sdk)
 *
 * Provides a unified public SDK facade and re-exports all 11 standalone platform engine packages:
 * - @geosphere/location
 * - @geosphere/tracking
 * - @geosphere/geofencing
 * - @geosphere/routing
 * - @geosphere/forms
 * - @geosphere/tasks
 * - @geosphere/media
 * - @geosphere/notifications
 * - @geosphere/analytics
 * - @geosphere/offline
 * - @geosphere/security
 *
 * MUST NOT import Next.js path aliases (@/), OpenLayers directly in facade, React, or vehicle-specific code.
 */

// Facade & Configuration Exports
export * from "./types/web-sdk.types";
export * from "./facade/geosphere-sdk";

// Engine Package Re-exports
export * from "../../gis-location/src";
export * from "../../gis-tracking/src";
export * from "../../gis-geofencing/src";
export * from "../../gis-routing/src";
export * from "../../gis-forms/src";
export * from "../../gis-tasks/src";
export * from "../../gis-media/src";
export * from "../../gis-notifications/src";
export * from "../../gis-analytics/src";
export * from "../../gis-offline/src";
export * from "../../gis-security/src";
