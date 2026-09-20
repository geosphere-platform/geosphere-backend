-- Phase 10 Migration: Performance & Analytics Indexes for GIS Query Engine

-- 1. Index on spatial_events for geofence analytics & event queries
CREATE INDEX IF NOT EXISTS idx_spatial_events_geofence_ts
  ON spatial_events (tenant_id, ((metadata->>'geofenceId')), timestamp);

CREATE INDEX IF NOT EXISTS idx_spatial_events_type_ts
  ON spatial_events (tenant_id, type, timestamp);

CREATE INDEX IF NOT EXISTS idx_spatial_events_subject_ts
  ON spatial_events (tenant_id, subject_id, timestamp);

-- 2. Index on spatial_subjects for active status & quick lookup
CREATE INDEX IF NOT EXISTS idx_spatial_subjects_tenant_active
  ON spatial_subjects (tenant_id, active, type);

-- 3. Text search index on spatial_subjects name for fast search
CREATE INDEX IF NOT EXISTS idx_spatial_subjects_name_trgm
  ON spatial_subjects USING gin (name gin_trgm_ops);

-- 4. Index on spatial_features type & tenant
CREATE INDEX IF NOT EXISTS idx_spatial_features_tenant_type
  ON spatial_features (tenant_id, type);
