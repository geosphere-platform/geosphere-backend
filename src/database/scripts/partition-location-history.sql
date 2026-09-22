-- ============================================================================
-- GeoSphere Enterprise GIS — Production Database Partitioning Migration
-- Target Table: spatial_location_history
-- Partition Strategy: Declarative Range Partitioning by UTC Month
--
-- Why:
-- In fleet and asset tracking, GPS telemetry is an append-only time series.
-- A non-partitioned table degrades index performance after millions of records.
-- Range partitioning ensures:
-- 1. High-speed history queries (Postgres skips untouched monthly partitions)
-- 2. Fast data retention policies (DROP older monthly partition instantly)
-- ============================================================================

-- Step 1: Create new partitioned table structure
CREATE TABLE IF NOT EXISTS "spatial_location_history_partitioned" (
    "id" uuid DEFAULT gen_random_uuid(),
    "tenant_id" uuid NOT NULL,
    "subject_id" uuid NOT NULL,
    "location" geometry(Geometry, 4326) NOT NULL,
    "timestamp" timestamp NOT NULL,
    "accuracy" double precision,
    "speed" double precision,
    "heading" double precision,
    "source" varchar(30) NOT NULL DEFAULT 'api',
    "metadata" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "created_at" timestamp NOT NULL DEFAULT now(),
    PRIMARY KEY ("id", "timestamp")
) PARTITION BY RANGE ("timestamp");

-- Step 2: Create initial monthly partitions (Example: 2026 partitions)
CREATE TABLE IF NOT EXISTS "spatial_location_history_2026_09"
    PARTITION OF "spatial_location_history_partitioned"
    FOR VALUES FROM ('2026-09-01 00:00:00') TO ('2026-10-01 00:00:00');

CREATE TABLE IF NOT EXISTS "spatial_location_history_2026_10"
    PARTITION OF "spatial_location_history_partitioned"
    FOR VALUES FROM ('2026-10-01 00:00:00') TO ('2026-11-01 00:00:00');

CREATE TABLE IF NOT EXISTS "spatial_location_history_2026_11"
    PARTITION OF "spatial_location_history_partitioned"
    FOR VALUES FROM ('2026-11-01 00:00:00') TO ('2026-12-01 00:00:00');

CREATE TABLE IF NOT EXISTS "spatial_location_history_2026_12"
    PARTITION OF "spatial_location_history_partitioned"
    FOR VALUES FROM ('2026-12-01 00:00:00') TO ('2027-01-01 00:00:00');

-- Default partition catches any future or past records before dedicated partition is created
CREATE TABLE IF NOT EXISTS "spatial_location_history_default"
    PARTITION OF "spatial_location_history_partitioned" DEFAULT;

-- Step 3: Global GiST and Lookup indexes on partitioned table
CREATE INDEX IF NOT EXISTS "idx_part_loc_history_geom" 
    ON "spatial_location_history_partitioned" USING GIST ("location");

CREATE INDEX IF NOT EXISTS "idx_part_loc_history_sub_ts" 
    ON "spatial_location_history_partitioned" ("tenant_id", "subject_id", "timestamp" DESC);

CREATE INDEX IF NOT EXISTS "idx_part_loc_history_tenant_ts" 
    ON "spatial_location_history_partitioned" ("tenant_id", "timestamp" DESC);

-- Step 4: Data migration procedure (Run during scheduled maintenance window)
-- INSERT INTO "spatial_location_history_partitioned" SELECT * FROM "spatial_location_history";
-- ALTER TABLE "spatial_location_history" RENAME TO "spatial_location_history_old";
-- ALTER TABLE "spatial_location_history_partitioned" RENAME TO "spatial_location_history";
