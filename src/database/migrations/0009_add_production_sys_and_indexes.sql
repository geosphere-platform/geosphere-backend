-- Phase 17 Migration: Production System Tables & PostGIS Spatial Indexes

CREATE TABLE IF NOT EXISTS sys_jobs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    workspace_id VARCHAR(64),
    user_id VARCHAR(64),
    type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    payload JSONB NOT NULL,
    result JSONB,
    error_message TEXT,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sys_jobs_tenant_org ON sys_jobs (tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_sys_jobs_status ON sys_jobs (status);
CREATE INDEX IF NOT EXISTS idx_sys_jobs_type ON sys_jobs (type);
CREATE INDEX IF NOT EXISTS idx_sys_jobs_created_at ON sys_jobs (created_at);

CREATE TABLE IF NOT EXISTS sys_audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    tenant_id VARCHAR(64) NOT NULL,
    organization_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64),
    action VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    ip_address VARCHAR(64),
    user_agent TEXT,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sys_audit_tenant_org ON sys_audit_logs (tenant_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_sys_audit_action ON sys_audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_sys_audit_category ON sys_audit_logs (category);
CREATE INDEX IF NOT EXISTS idx_sys_audit_created_at ON sys_audit_logs (created_at);

CREATE TABLE IF NOT EXISTS sys_rate_limits (
    key VARCHAR(256) PRIMARY KEY,
    tokens INTEGER NOT NULL,
    last_refill_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sys_rate_limits_expires ON sys_rate_limits (expires_at);

-- Additional Production Spatial & Multi-Tenant Performance Indexes
CREATE INDEX IF NOT EXISTS idx_gis_features_tenant_workspace ON spatial_features (tenant_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_gis_features_layer ON spatial_features (layer_id);
CREATE INDEX IF NOT EXISTS idx_gis_geofences_tenant_workspace ON gis_geofences (tenant_id, workspace_id);
CREATE INDEX IF NOT EXISTS idx_gis_tracking_tenant_subject ON gis_tracking_positions (tenant_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_gis_tracking_timestamp ON gis_tracking_positions (recorded_at);
