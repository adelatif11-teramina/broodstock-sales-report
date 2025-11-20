import { z } from 'zod';

// ==============================================================================
// ENUMS
// ==============================================================================

export const SyncStatus = z.enum(['pending', 'running', 'completed', 'failed', 'partial']);
export const SyncSource = z.enum(['google_sheets', 'csv_upload', 'manual_entry']);
export const EntityType = z.enum(['customer', 'order', 'broodstock_batch']);
export const SyncMode = z.enum(['insert_only', 'upsert', 'replace']);
export const ErrorType = z.enum([
  'validation_error',
  'duplicate',
  'missing_reference',
  'database_error',
  'type_error',
  'business_rule_violation',
]);

// ==============================================================================
// SYNC CONFIGURATION SCHEMAS
// ==============================================================================

export const SyncConfigSchema = z.object({
  id: z.string().uuid().optional(),
  config_key: z.string().min(1).max(100),
  config_value: z.string(),
  description: z.string().optional(),
  is_sensitive: z.boolean().default(false),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
  updated_by: z.string().uuid().optional(),
});

export const UpdateSyncConfigSchema = z.object({
  config_value: z.string().min(1),
  updated_by: z.string().uuid(),
});

// ==============================================================================
// SYNC JOB SCHEMAS
// ==============================================================================

export const CreateSyncJobSchema = z.object({
  source: SyncSource.default('google_sheets'),
  triggered_by: z.string().uuid(),
  metadata: z.object({
    sheet_id: z.string().optional(),
    sheet_ranges: z.array(z.string()).optional(),
    mode: SyncMode.default('insert_only'),
    sheets_to_sync: z.array(z.string()).optional(), // ['customers', 'orders', 'batches']
  }).optional(),
});

export const UpdateSyncJobSchema = z.object({
  status: SyncStatus,
  completed_at: z.date().optional(),
  records_processed: z.number().int().min(0).optional(),
  records_inserted: z.number().int().min(0).optional(),
  records_skipped: z.number().int().min(0).optional(),
  records_failed: z.number().int().min(0).optional(),
  customers_inserted: z.number().int().min(0).optional(),
  orders_inserted: z.number().int().min(0).optional(),
  batches_inserted: z.number().int().min(0).optional(),
  error_summary: z.record(z.string(), z.number()).optional(),
  error_message: z.string().optional(),
});

export const SyncJobFilterSchema = z.object({
  status: SyncStatus.optional(),
  source: SyncSource.optional(),
  triggered_by: z.string().uuid().optional(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['started_at', 'completed_at', 'status']).default('started_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// ==============================================================================
// SYNC ERROR SCHEMAS
// ==============================================================================

export const CreateSyncErrorSchema = z.object({
  sync_job_id: z.string().uuid(),
  row_number: z.number().int().min(1),
  sheet_name: z.string().max(100).optional(),
  entity_type: EntityType,
  error_type: ErrorType,
  error_message: z.string().min(1),
  field_name: z.string().max(100).optional(),
  invalid_value: z.string().optional(),
  data_snapshot: z.record(z.string(), z.any()),
});

export const SyncErrorFilterSchema = z.object({
  sync_job_id: z.string().uuid(),
  entity_type: EntityType.optional(),
  error_type: ErrorType.optional(),
  sheet_name: z.string().optional(),
  limit: z.number().min(1).max(500).default(100),
  offset: z.number().min(0).default(0),
});

// ==============================================================================
// SYNC AUDIT LOG SCHEMAS
// ==============================================================================

export const CreateSyncAuditLogSchema = z.object({
  sync_job_id: z.string().uuid(),
  entity_type: EntityType,
  entity_id: z.string().uuid(),
  action: z.enum(['insert', 'update', 'skip']).default('insert'),
  row_number: z.number().int().min(1),
  data_snapshot: z.record(z.string(), z.any()).optional(),
});

// ==============================================================================
// GOOGLE SHEETS DATA ROW SCHEMAS
// ==============================================================================
// These schemas validate raw data coming from Google Sheets

export const GoogleSheetsCustomerRowSchema = z.object({
  // Required fields
  name: z.string().min(2).max(255),
  primary_contact_name: z.string().min(2).max(255),

  // Optional fields
  email: z.string().email().max(255).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
  province: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(100).optional().or(z.literal('')),
  latitude: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  longitude: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  status: z.enum(['active', 'paused', 'blacklisted']).optional().or(z.literal('')),

  // Credentials (simplified for sheets - can have multiple columns)
  credential_type_1: z.string().optional().or(z.literal('')),
  credential_number_1: z.string().optional().or(z.literal('')),
  credential_issued_1: z.string().optional().or(z.literal('')),
  credential_expiry_1: z.string().optional().or(z.literal('')),
  credential_file_url_1: z.string().optional().or(z.literal('')),

  credential_type_2: z.string().optional().or(z.literal('')),
  credential_number_2: z.string().optional().or(z.literal('')),
  credential_issued_2: z.string().optional().or(z.literal('')),
  credential_expiry_2: z.string().optional().or(z.literal('')),
  credential_file_url_2: z.string().optional().or(z.literal('')),

  credential_type_3: z.string().optional().or(z.literal('')),
  credential_number_3: z.string().optional().or(z.literal('')),
  credential_issued_3: z.string().optional().or(z.literal('')),
  credential_expiry_3: z.string().optional().or(z.literal('')),
  credential_file_url_3: z.string().optional().or(z.literal('')),
});

export const GoogleSheetsOrderRowSchema = z.object({
  // Required fields
  customer_email: z.string().email(), // Used to lookup customer_id
  order_date: z.union([z.string(), z.date()]),
  species: z.string().min(1).max(255),
  quantity: z.union([z.string(), z.number()]),
  unit_price: z.union([z.string(), z.number()]),

  // Optional fields
  broodstock_batch_code: z.string().max(100).optional().or(z.literal('')),
  strain: z.string().max(255).optional().or(z.literal('')),
  unit: z.string().max(50).optional().or(z.literal('')),
  unit_price_currency: z.string().length(3).optional().or(z.literal('')),
  total_value_currency: z.string().length(3).optional().or(z.literal('')),
  packaging_type: z.string().max(100).optional().or(z.literal('')),
  shipment_date: z.union([z.string(), z.date()]).optional().or(z.literal('')),
  shipment_status: z.enum(['pending', 'shipped', 'delivered', 'problem']).optional().or(z.literal('')),
  quality_flag: z.enum(['ok', 'minor_issue', 'critical_issue']).optional().or(z.literal('')),
  mortality_reported: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export const GoogleSheetsBatchRowSchema = z.object({
  // Required fields
  batch_code: z.string().min(1).max(100),
  hatchery_origin: z.string().min(1).max(255),
  arrival_date: z.union([z.string(), z.date()]),
  available_quantity: z.union([z.string(), z.number()]),

  // Optional fields
  grade: z.string().max(100).optional().or(z.literal('')),
  initial_quantity: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  species: z.string().max(255).optional().or(z.literal('')),
  strain: z.string().max(255).optional().or(z.literal('')),
  age_weeks: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  weight_grams: z.union([z.string(), z.number()]).optional().or(z.literal('')),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor']).optional().or(z.literal('')),
  quarantine_status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

// ==============================================================================
// TYPE EXPORTS
// ==============================================================================

export type SyncConfig = z.infer<typeof SyncConfigSchema>;
export type UpdateSyncConfigInput = z.infer<typeof UpdateSyncConfigSchema>;

export type SyncJob = {
  id: string;
  source: z.infer<typeof SyncSource>;
  status: z.infer<typeof SyncStatus>;
  started_at: Date;
  completed_at?: Date;
  records_processed: number;
  records_inserted: number;
  records_skipped: number;
  records_failed: number;
  customers_inserted: number;
  orders_inserted: number;
  batches_inserted: number;
  error_summary?: Record<string, number>;
  error_message?: string;
  triggered_by?: string;
  metadata?: {
    sheet_id?: string;
    sheet_ranges?: string[];
    mode?: z.infer<typeof SyncMode>;
    sheets_to_sync?: string[];
  };
  created_at: Date;
};

export type CreateSyncJobInput = z.infer<typeof CreateSyncJobSchema>;
export type UpdateSyncJobInput = z.infer<typeof UpdateSyncJobSchema>;
export type SyncJobFilter = z.infer<typeof SyncJobFilterSchema>;

export type SyncError = {
  id: string;
  sync_job_id: string;
  row_number: number;
  sheet_name?: string;
  entity_type: z.infer<typeof EntityType>;
  error_type: z.infer<typeof ErrorType>;
  error_message: string;
  field_name?: string;
  invalid_value?: string;
  data_snapshot: Record<string, any>;
  created_at: Date;
};

export type CreateSyncErrorInput = z.infer<typeof CreateSyncErrorSchema>;
export type SyncErrorFilter = z.infer<typeof SyncErrorFilterSchema>;

export type SyncAuditLog = {
  id: string;
  sync_job_id: string;
  entity_type: z.infer<typeof EntityType>;
  entity_id: string;
  action: 'insert' | 'update' | 'skip';
  row_number: number;
  data_snapshot?: Record<string, any>;
  created_at: Date;
};

export type CreateSyncAuditLogInput = z.infer<typeof CreateSyncAuditLogSchema>;

export type GoogleSheetsCustomerRow = z.infer<typeof GoogleSheetsCustomerRowSchema>;
export type GoogleSheetsOrderRow = z.infer<typeof GoogleSheetsOrderRowSchema>;
export type GoogleSheetsBatchRow = z.infer<typeof GoogleSheetsBatchRowSchema>;

// ==============================================================================
// SYNC TRIGGER REQUEST SCHEMA
// ==============================================================================

export const TriggerSyncSchema = z.object({
  sheet_id: z.string().optional(), // If not provided, use default from config
  sheets_to_sync: z.array(z.enum(['customers', 'orders', 'batches'])).optional(), // If not provided, sync all
  mode: SyncMode.default('insert_only'),
});

export type TriggerSyncInput = z.infer<typeof TriggerSyncSchema>;
