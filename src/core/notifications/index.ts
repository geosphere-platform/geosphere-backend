/**
 * GeoSphere Core Notification & Alert Engine — Domain Entrypoint
 *
 * Framework-independent Notification Engine providing multi-channel dispatch, alert rule evaluation,
 * rate limiting, template variable interpolation, and NotificationEngine.
 */

export * from "./types/notification.types";
export * from "./channel/notification-channel.interface";
export * from "./engine/notification-engine";
