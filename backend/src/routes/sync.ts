import { Router, Request, Response } from 'express';
import { syncService } from '../services/syncService';
import { pool } from '../config/database';
import {
  TriggerSyncSchema,
  SyncJobFilterSchema,
  SyncErrorFilterSchema,
  UpdateSyncConfigSchema,
} from '../models/sync';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All sync routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/sync/google-sheets/trigger
 * Manually trigger a sync from Google Sheets
 */
router.post('/google-sheets/trigger', authorize(['manager', 'admin']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;

    // Validate request body
    const validatedInput = TriggerSyncSchema.parse(req.body);

    // Trigger sync (async - returns immediately)
    const syncJob = await syncService.triggerSync(validatedInput, userId);

    res.status(202).json({
      success: true,
      message: 'Sync job started',
      data: {
        sync_job_id: syncJob.id,
        status: syncJob.status,
        started_at: syncJob.started_at,
      },
    });
  } catch (error: any) {
    console.error('Trigger sync error:', error);

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to trigger sync',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/status/:jobId
 * Get status of a specific sync job
 */
router.get('/google-sheets/status/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    const syncJob = await syncService.getSyncJob(jobId);

    if (!syncJob) {
      return res.status(404).json({
        success: false,
        error: 'Sync job not found',
      });
    }

    res.json({
      success: true,
      data: syncJob,
    });
  } catch (error: any) {
    console.error('Get sync status error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sync status',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/history
 * Get sync job history with pagination
 */
router.get('/google-sheets/history', async (req: Request, res: Response) => {
  try {
    // Parse query parameters
    const filter = SyncJobFilterSchema.parse({
      status: req.query.status,
      source: req.query.source,
      triggered_by: req.query.triggered_by,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sort_by: req.query.sort_by || 'started_at',
      sort_order: req.query.sort_order || 'desc',
    });

    const result = await syncService.getSyncJobHistory(filter);

    res.json({
      success: true,
      data: result.jobs,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        has_more: filter.offset + filter.limit < result.total,
      },
    });
  } catch (error: any) {
    console.error('Get sync history error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sync history',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/errors/:jobId
 * Get detailed errors for a specific sync job
 */
router.get('/google-sheets/errors/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Parse query parameters
    const filter = SyncErrorFilterSchema.parse({
      sync_job_id: jobId,
      entity_type: req.query.entity_type,
      error_type: req.query.error_type,
      sheet_name: req.query.sheet_name,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    });

    const result = await syncService.getSyncErrors(filter);

    res.json({
      success: true,
      data: result.errors,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        has_more: filter.offset + filter.limit < result.total,
      },
    });
  } catch (error: any) {
    console.error('Get sync errors error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sync errors',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/errors/:jobId/export
 * Export sync errors as CSV
 */
router.get('/google-sheets/errors/:jobId/export', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    // Get all errors for this job
    const result = await syncService.getSyncErrors({
      sync_job_id: jobId,
      limit: 10000, // Large limit to get all errors
      offset: 0,
    });

    // Generate CSV
    const headers = [
      'Row Number',
      'Sheet Name',
      'Entity Type',
      'Error Type',
      'Error Message',
      'Field Name',
      'Invalid Value',
    ];

    const rows = result.errors.map(error => [
      error.row_number,
      error.sheet_name || '',
      error.entity_type,
      error.error_type,
      error.error_message,
      error.field_name || '',
      error.invalid_value || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sync-errors-${jobId}.csv"`);
    res.send(csv);
  } catch (error: any) {
    console.error('Export sync errors error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to export sync errors',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/config
 * Get sync configuration
 */
router.get('/google-sheets/config', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT config_key, config_value, description, is_sensitive
      FROM sync_config
      ORDER BY config_key
    `);

    const config: Record<string, any> = {};

    result.rows.forEach(row => {
      // Don't expose sensitive values
      config[row.config_key] = {
        value: row.is_sensitive ? '***' : row.config_value,
        description: row.description,
        is_sensitive: row.is_sensitive,
      };
    });

    res.json({
      success: true,
      data: config,
    });
  } catch (error: any) {
    console.error('Get sync config error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get sync configuration',
    });
  }
});

/**
 * PUT /api/v1/sync/google-sheets/config/:key
 * Update a specific sync configuration value
 */
router.put('/google-sheets/config/:key', authorize(['admin']), async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user!.id;

    const { key } = req.params;
    const validatedInput = UpdateSyncConfigSchema.parse({
      config_value: req.body.config_value,
      updated_by: userId,
    });

    // Update config
    await pool.query(
      `UPDATE sync_config
       SET config_value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
       WHERE config_key = $3`,
      [validatedInput.config_value, validatedInput.updated_by, key]
    );

    res.json({
      success: true,
      message: 'Configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Update sync config error:', error);

    res.status(400).json({
      success: false,
      error: error.message || 'Failed to update sync configuration',
    });
  }
});

/**
 * GET /api/v1/sync/google-sheets/template
 * Download Google Sheets template (instructions for users)
 */
router.get('/google-sheets/template', async (req: Request, res: Response) => {
  try {
    const template = `
# Google Sheets Sync Template

## Instructions

1. Create a new Google Sheet
2. Create three tabs: "Customers", "Orders", "Batches"
3. Copy the headers from each section below into the corresponding tab
4. Fill in your data (see format requirements)
5. Share the sheet with the service account email
6. Configure the Sheet ID in the system settings
7. Click "Sync Now" to import data

---

## Customers Tab

### Headers (Row 1):
name | primary_contact_name | email | phone | address | country | province | district | latitude | longitude | status | credential_type_1 | credential_number_1 | credential_issued_1 | credential_expiry_1 | credential_file_url_1

### Required Fields:
- name: Customer company name (2-255 characters)
- primary_contact_name: Main contact person (2-255 characters)
- email OR phone: At least one must be provided

### Optional Fields:
- address: Full address text
- country, province, district: Location details
- latitude, longitude: Decimal coordinates (e.g., 13.7563, 100.5018)
- status: active | paused | blacklisted (default: active)
- credential_type_1: license | permit | certificate | registration
- credential_number_1: Credential ID/number
- credential_issued_1: Date in YYYY-MM-DD format
- credential_expiry_1: Date in YYYY-MM-DD format
- credential_file_url_1: Public URL to credential file

### Notes:
- Can add up to 3 credentials (use _1, _2, _3 suffixes)
- Dates must be in YYYY-MM-DD format
- Lat/Lng must both be provided together
- Duplicate emails will be skipped

---

## Orders Tab

### Headers (Row 1):
customer_email | order_date | species | strain | quantity | unit_price | unit | unit_price_currency | total_value_currency | broodstock_batch_code | packaging_type | shipment_date | shipment_status | quality_flag | mortality_reported | notes

### Required Fields:
- customer_email: Must match an existing customer email
- order_date: Date in YYYY-MM-DD format
- species: Species name (e.g., "Penaeus vannamei")
- quantity: Integer number of units
- unit_price: Decimal price per unit

### Optional Fields:
- strain: Strain name
- unit: piece | kg | lb (default: piece)
- unit_price_currency: USD | EUR | THB (default: USD)
- total_value_currency: USD | EUR | THB (default: USD)
- broodstock_batch_code: Must match existing batch code
- packaging_type: Description of packaging
- shipment_date: Date in YYYY-MM-DD format
- shipment_status: pending | shipped | delivered | problem (default: pending)
- quality_flag: ok | minor_issue | critical_issue (default: ok)
- mortality_reported: Integer count of mortalities
- notes: Additional notes

### Notes:
- Customer must exist before creating order
- Batch must exist if broodstock_batch_code is provided
- Order date cannot be in future
- Quantity and price must be positive

---

## Batches Tab

### Headers (Row 1):
batch_code | hatchery_origin | grade | arrival_date | available_quantity | initial_quantity | species | strain | age_weeks | weight_grams | health_status | quarantine_status | notes

### Required Fields:
- batch_code: Unique batch identifier
- hatchery_origin: Name of source hatchery
- arrival_date: Date in YYYY-MM-DD format
- available_quantity: Integer count available

### Optional Fields:
- grade: Quality grade
- initial_quantity: Starting quantity (default: same as available)
- species: Species name
- strain: Strain name
- age_weeks: Decimal age in weeks
- weight_grams: Decimal weight in grams
- health_status: excellent | good | fair | poor (default: good)
- quarantine_status: pending | in_progress | completed | failed (default: pending)
- notes: Additional notes

### Notes:
- Batch codes must be unique
- Duplicate batch codes will be skipped
- Available quantity cannot exceed initial quantity
- Arrival date cannot be in future

---

## General Notes

- All dates must be in YYYY-MM-DD format (e.g., 2025-01-15)
- Empty cells are treated as NULL/not provided
- Completely empty rows are skipped
- Insert-only mode: Duplicates are skipped (not updated)
- All errors will be reported with row numbers for easy fixing
`;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', 'attachment; filename="google-sheets-sync-template.txt"');
    res.send(template);
  } catch (error: any) {
    console.error('Get template error:', error);

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get template',
    });
  }
});

export default router;
