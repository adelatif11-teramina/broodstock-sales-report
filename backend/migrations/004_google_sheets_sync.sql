-- Migration 004: Google Sheets Sync Infrastructure
-- Purpose: Add tables to support Google Sheets one-way sync functionality
-- Date: 2025-11-18

-- ==============================================================================
-- 1. SYNC CONFIGURATION TABLE
-- ==============================================================================
-- Stores Google Sheets sync configuration (sheet IDs, credentials path, etc.)

CREATE TABLE IF NOT EXISTS sync_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT NOT NULL,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE, -- For credentials, API keys
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID REFERENCES users(id)
);

-- Indexes for sync_config
CREATE INDEX idx_sync_config_key ON sync_config(config_key);

-- Trigger for updated_at
CREATE TRIGGER update_sync_config_updated_at
  BEFORE UPDATE ON sync_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 2. SYNC JOBS TABLE
-- ==============================================================================
-- Tracks each sync operation from Google Sheets

CREATE TYPE sync_status AS ENUM ('pending', 'running', 'completed', 'failed', 'partial');
CREATE TYPE sync_source AS ENUM ('google_sheets', 'csv_upload', 'manual_entry');

CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source sync_source NOT NULL DEFAULT 'google_sheets',
  status sync_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Processing metrics
  records_processed INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  -- Entity breakdown
  customers_inserted INTEGER DEFAULT 0,
  orders_inserted INTEGER DEFAULT 0,
  batches_inserted INTEGER DEFAULT 0,

  -- Error summary
  error_summary JSONB, -- { "customer_errors": 5, "order_errors": 3, "batch_errors": 0 }
  error_message TEXT, -- General error message if entire job fails

  -- Metadata
  triggered_by UUID REFERENCES users(id),
  metadata JSONB, -- { "sheet_id": "...", "sheet_ranges": [...], "mode": "insert_only" }

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sync_jobs
CREATE INDEX idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX idx_sync_jobs_started_at ON sync_jobs(started_at DESC);
CREATE INDEX idx_sync_jobs_triggered_by ON sync_jobs(triggered_by);
CREATE INDEX idx_sync_jobs_source ON sync_jobs(source);

-- ==============================================================================
-- 3. SYNC ERRORS TABLE
-- ==============================================================================
-- Stores detailed error information for each failed row during sync

CREATE TYPE entity_type AS ENUM ('customer', 'order', 'broodstock_batch');

CREATE TABLE IF NOT EXISTS sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,

  -- Row identification
  row_number INTEGER NOT NULL, -- Row number in the sheet (for user reference)
  sheet_name VARCHAR(100), -- Which sheet/tab: 'Customers', 'Orders', 'Batches'
  entity_type entity_type NOT NULL,

  -- Error details
  error_type VARCHAR(50) NOT NULL, -- 'validation_error', 'duplicate', 'missing_reference', 'database_error'
  error_message TEXT NOT NULL,
  field_name VARCHAR(100), -- Which field caused the error
  invalid_value TEXT, -- The value that failed validation

  -- Original data snapshot
  data_snapshot JSONB NOT NULL, -- Full row data for debugging

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sync_errors
CREATE INDEX idx_sync_errors_job_id ON sync_errors(sync_job_id);
CREATE INDEX idx_sync_errors_entity_type ON sync_errors(entity_type);
CREATE INDEX idx_sync_errors_error_type ON sync_errors(error_type);
CREATE INDEX idx_sync_errors_sheet_name ON sync_errors(sheet_name);

-- ==============================================================================
-- 4. SYNC AUDIT LOG
-- ==============================================================================
-- Optional: Track what was synced for compliance/debugging

CREATE TABLE IF NOT EXISTS sync_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_job_id UUID NOT NULL REFERENCES sync_jobs(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL, -- ID of the created record
  action VARCHAR(20) NOT NULL DEFAULT 'insert', -- For future: 'insert', 'update', 'skip'
  row_number INTEGER NOT NULL, -- Source row in sheet
  data_snapshot JSONB, -- What was inserted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sync_audit_log
CREATE INDEX idx_sync_audit_log_job_id ON sync_audit_log(sync_job_id);
CREATE INDEX idx_sync_audit_log_entity ON sync_audit_log(entity_type, entity_id);

-- ==============================================================================
-- 5. INSERT DEFAULT CONFIGURATION
-- ==============================================================================
-- Pre-populate with placeholder values

INSERT INTO sync_config (config_key, config_value, description, is_sensitive) VALUES
  ('google_sheets_enabled', 'false', 'Enable/disable Google Sheets sync feature', false),
  ('google_sheets_master_sheet_id', '', 'The Google Sheet ID to sync from', false),
  ('google_sheets_credentials_path', '/app/config/google-service-account.json', 'Path to Google service account JSON file', true),
  ('google_sheets_sync_mode', 'insert_only', 'Sync mode: insert_only, upsert, or replace', false),
  ('google_sheets_customer_range', 'Customers!A:Z', 'Range for customer data', false),
  ('google_sheets_order_range', 'Orders!A:Z', 'Range for order data', false),
  ('google_sheets_batch_range', 'Batches!A:Z', 'Range for batch data', false)
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================================================
-- 6. GRANT PERMISSIONS
-- ==============================================================================
-- Ensure appropriate access (adjust based on your user roles)

-- Grant access to sync tables
-- GRANT SELECT, INSERT, UPDATE ON sync_jobs TO app_user;
-- GRANT SELECT, INSERT ON sync_errors TO app_user;
-- GRANT SELECT, INSERT ON sync_audit_log TO app_user;
-- GRANT SELECT, UPDATE ON sync_config TO app_user;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================

COMMENT ON TABLE sync_config IS 'Configuration settings for Google Sheets sync';
COMMENT ON TABLE sync_jobs IS 'Tracks each Google Sheets sync operation';
COMMENT ON TABLE sync_errors IS 'Detailed error log for failed sync rows';
COMMENT ON TABLE sync_audit_log IS 'Audit trail of all synced records';
