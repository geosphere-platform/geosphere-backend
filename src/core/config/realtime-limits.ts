/**
 * Real-Time Spatial Engine Operational & Safety Limits
 */

export const REALTIME_ENGINE_LIMITS = {
  /** Maximum number of location updates per batch ingestion API call */
  MAX_BATCH_INGESTION_SIZE: 100,

  /** Maximum acceptable clock skew into the future (15 minutes in ms) */
  MAX_FUTURE_CLOCK_SKEW_MS: 15 * 60 * 1000,

  /** Maximum acceptable age for historical location updates (30 days in ms) */
  MAX_PAST_CLOCK_SKEW_MS: 30 * 24 * 60 * 60 * 1000,

  /** Maximum allowed size for update JSON metadata payload (bytes) */
  MAX_METADATA_SIZE_BYTES: 10_000,

  /** Default maximum limit of subjects returned in viewport spatial query */
  DEFAULT_VIEWPORT_LIMIT: 200,

  /** Maximum absolute limit of subjects returned in viewport spatial query */
  MAX_VIEWPORT_LIMIT: 500,

  /** Default speed unit internally stored (meters per second) */
  INTERNAL_SPEED_UNIT: "meters_per_second",

  /** Max accuracy threshold in meters (locations exceeding threshold are flagged as POOR_ACCURACY) */
  DEFAULT_ACCURACY_THRESHOLD_METERS: 200,

  /** Maximum active WebSocket channel subscriptions per client connection */
  MAX_SUBSCRIPTIONS_PER_CLIENT: 20,
} as const;
