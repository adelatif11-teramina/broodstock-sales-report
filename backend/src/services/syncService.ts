import { pool } from '../config/database';
import { getGoogleSheetsService } from './googleSheetsService';
import { validationService, ValidationError } from './validationService';
import {
  CreateSyncJobInput,
  UpdateSyncJobInput,
  SyncJob,
  SyncError,
  SyncJobFilter,
  SyncErrorFilter,
  TriggerSyncInput,
} from '../models/sync';
import { generateOrderNumber } from '../utils/orderNumber';

/**
 * Sync Service
 * Orchestrates the entire sync process from Google Sheets to database
 */
export class SyncService {
  /**
   * Trigger a sync job from Google Sheets
   * @param input - Sync trigger input (sheet_id, sheets_to_sync, mode)
   * @param triggeredBy - User ID who triggered the sync
   * @returns Created sync job
   */
  async triggerSync(input: TriggerSyncInput, triggeredBy: string): Promise<SyncJob> {
    // Step 1: Get sync configuration
    const config = await this.getSyncConfig();

    if (!config.enabled) {
      throw new Error('Google Sheets sync is disabled. Enable it in settings.');
    }

    const sheetId = input.sheet_id || config.masterSheetId;

    if (!sheetId) {
      throw new Error('No Google Sheet ID configured. Please configure in settings.');
    }

    // Step 2: Create sync job record
    const syncJob = await this.createSyncJob({
      source: 'google_sheets',
      triggered_by: triggeredBy,
      metadata: {
        sheet_id: sheetId,
        mode: input.mode || 'insert_only',
        sheets_to_sync: input.sheets_to_sync || ['customers', 'orders', 'batches'],
      },
    });

    // Step 3: Run sync asynchronously (don't await - run in background)
    this.runSync(syncJob.id, sheetId, config, input).catch((error) => {
      console.error(`Sync job ${syncJob.id} failed:`, error.message);
      // Update job as failed
      this.updateSyncJob(syncJob.id, {
        status: 'failed',
        completed_at: new Date(),
        error_message: error.message,
      });
    });

    return syncJob;
  }

  /**
   * Run the actual sync process (called asynchronously)
   */
  private async runSync(
    syncJobId: string,
    sheetId: string,
    config: any,
    input: TriggerSyncInput
  ): Promise<void> {
    const client = await pool.connect();

    try {
      // Update status to running
      await this.updateSyncJob(syncJobId, { status: 'running' });

      // Initialize Google Sheets service
      const sheetsService = getGoogleSheetsService();
      await sheetsService.initialize(config.credentialsPath);

      const sheetsToSync = input.sheets_to_sync || ['customers', 'orders', 'batches'];
      const allErrors: ValidationError[] = [];
      let totalProcessed = 0;
      let totalInserted = 0;
      let totalSkipped = 0;
      let customersInserted = 0;
      let ordersInserted = 0;
      let batchesInserted = 0;

      // Step 1: Sync Customers (must be first - orders depend on customers)
      if (sheetsToSync.includes('customers')) {
        const customerResult = await this.syncCustomers(
          sheetsService,
          sheetId,
          config.customerRange,
          client,
          syncJobId
        );

        totalProcessed += customerResult.processed;
        totalInserted += customerResult.inserted;
        totalSkipped += customerResult.skipped;
        customersInserted = customerResult.inserted;
        allErrors.push(...customerResult.errors);
      }

      // Step 2: Sync Batches (must be before orders - orders reference batches)
      if (sheetsToSync.includes('batches')) {
        const batchResult = await this.syncBatches(
          sheetsService,
          sheetId,
          config.batchRange,
          client,
          syncJobId
        );

        totalProcessed += batchResult.processed;
        totalInserted += batchResult.inserted;
        totalSkipped += batchResult.skipped;
        batchesInserted = batchResult.inserted;
        allErrors.push(...batchResult.errors);
      }

      // Step 3: Sync Orders (last - depends on customers and batches)
      if (sheetsToSync.includes('orders')) {
        const orderResult = await this.syncOrders(
          sheetsService,
          sheetId,
          config.orderRange,
          client,
          syncJobId
        );

        totalProcessed += orderResult.processed;
        totalInserted += orderResult.inserted;
        totalSkipped += orderResult.skipped;
        ordersInserted = orderResult.inserted;
        allErrors.push(...orderResult.errors);
      }

      // Step 4: Save all errors to database
      if (allErrors.length > 0) {
        await this.saveSyncErrors(syncJobId, allErrors);
      }

      // Step 5: Update sync job with final status
      const finalStatus = allErrors.length > 0
        ? (totalInserted > 0 ? 'partial' : 'failed')
        : 'completed';

      await this.updateSyncJob(syncJobId, {
        status: finalStatus,
        completed_at: new Date(),
        records_processed: totalProcessed,
        records_inserted: totalInserted,
        records_skipped: totalSkipped,
        records_failed: allErrors.length,
        customers_inserted: customersInserted,
        orders_inserted: ordersInserted,
        batches_inserted: batchesInserted,
        error_summary: {
          customer_errors: allErrors.filter(e => e.entityType === 'customer').length,
          order_errors: allErrors.filter(e => e.entityType === 'order').length,
          batch_errors: allErrors.filter(e => e.entityType === 'broodstock_batch').length,
        } as Record<string, number>,
      });

      console.log(`✅ Sync job ${syncJobId} completed: ${totalInserted} inserted, ${allErrors.length} errors`);
    } catch (error: any) {
      console.error(`❌ Sync job ${syncJobId} failed:`, error.message);

      await this.updateSyncJob(syncJobId, {
        status: 'failed',
        completed_at: new Date(),
        error_message: error.message,
      });

      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Sync customers from Google Sheets
   */
  private async syncCustomers(
    sheetsService: any,
    sheetId: string,
    range: string,
    client: any,
    syncJobId: string
  ): Promise<{ processed: number; inserted: number; skipped: number; errors: ValidationError[] }> {
    console.log(`📊 Syncing customers from ${range}...`);

    // Read data from sheets
    const rawRows = await sheetsService.readRange(sheetId, range);
    const parsedRows = sheetsService.parseCustomerRows(rawRows);

    console.log(`  Found ${parsedRows.length} customer rows`);

    // Validate data
    const { validRows, errors } = validationService.validateCustomerRows(parsedRows);

    console.log(`  Valid: ${validRows.length}, Errors: ${errors.length}`);

    let inserted = 0;
    let skipped = 0;

    // Insert valid rows (in transaction)
    for (const row of validRows) {
      try {
        await client.query('BEGIN');

        // Check if customer already exists (by email - insert-only mode)
        if (row.data.email) {
          const existingCheck = await client.query(
            'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
            [row.data.email]
          );

          if (existingCheck.rows.length > 0) {
            skipped++;
            await client.query('ROLLBACK');

            errors.push({
              rowNumber: row.rowNumber,
              sheetName: 'Customers',
              entityType: 'customer',
              errorType: 'duplicate',
              errorMessage: `Customer with email ${row.data.email} already exists`,
              fieldName: 'email',
              invalidValue: row.data.email,
              dataSnapshot: row.data,
            });

            continue;
          }
        }

        // Build location point if latitude/longitude provided
        let locationPoint = null;
        if (row.data.latitude !== undefined && row.data.longitude !== undefined) {
          locationPoint = `POINT(${row.data.longitude} ${row.data.latitude})`;
        }

        // Insert customer
        const insertQuery = `
          INSERT INTO customers (
            name, primary_contact_name, primary_contact_phone, email,
            address_text, location, country, province, district,
            status, credentials
          ) VALUES (
            $1, $2, $3, $4, $5, ${locationPoint ? `ST_SetSRID(ST_GeomFromText('${locationPoint}'), 4326)` : 'NULL'}, $6, $7, $8, $9, $10
          ) RETURNING id
        `;

        const values = [
          row.data.name,
          row.data.primary_contact_name,
          row.data.primary_contact_phone || null,
          row.data.email || null,
          row.data.address_text || null,
          // location is handled in the query string
          row.data.country || null,
          row.data.province || null,
          row.data.district || null,
          row.data.status || 'active',
          row.data.credentials ? JSON.stringify(row.data.credentials) : null,
        ];

        const result = await client.query(insertQuery, values);
        const customerId = result.rows[0].id;

        // Log to audit
        await this.logSyncAudit(client, syncJobId, 'customer', customerId, row.rowNumber, row.data);

        await client.query('COMMIT');
        inserted++;
      } catch (error: any) {
        await client.query('ROLLBACK');

        errors.push({
          rowNumber: row.rowNumber,
          sheetName: 'Customers',
          entityType: 'customer',
          errorType: 'database_error',
          errorMessage: error.message,
          dataSnapshot: row.data,
        });
      }
    }

    console.log(`  ✅ Customers synced: ${inserted} inserted, ${skipped} skipped`);

    return {
      processed: parsedRows.length,
      inserted,
      skipped,
      errors,
    };
  }

  /**
   * Sync batches from Google Sheets
   */
  private async syncBatches(
    sheetsService: any,
    sheetId: string,
    range: string,
    client: any,
    syncJobId: string
  ): Promise<{ processed: number; inserted: number; skipped: number; errors: ValidationError[] }> {
    console.log(`📊 Syncing batches from ${range}...`);

    const rawRows = await sheetsService.readRange(sheetId, range);
    const parsedRows = sheetsService.parseBatchRows(rawRows);

    console.log(`  Found ${parsedRows.length} batch rows`);

    const { validRows, errors } = validationService.validateBatchRows(parsedRows);

    console.log(`  Valid: ${validRows.length}, Errors: ${errors.length}`);

    let inserted = 0;
    let skipped = 0;

    for (const row of validRows) {
      try {
        await client.query('BEGIN');

        // Check if batch already exists (by batch_code - insert-only mode)
        const existingCheck = await client.query(
          'SELECT id FROM broodstock_batches WHERE batch_code = $1',
          [row.data.batch_code]
        );

        if (existingCheck.rows.length > 0) {
          skipped++;
          await client.query('ROLLBACK');

          errors.push({
            rowNumber: row.rowNumber,
            sheetName: 'Batches',
            entityType: 'broodstock_batch',
            errorType: 'duplicate',
            errorMessage: `Batch with code ${row.data.batch_code} already exists`,
            fieldName: 'batch_code',
            invalidValue: row.data.batch_code,
            dataSnapshot: row.data,
          });

          continue;
        }

        // Insert batch
        const insertQuery = `
          INSERT INTO broodstock_batches (
            batch_code, hatchery_origin, grade, arrival_date,
            available_quantity, initial_quantity, species, strain,
            age_weeks, weight_grams, health_status, quarantine_status, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          RETURNING id
        `;

        const values = [
          row.data.batch_code,
          row.data.hatchery_origin,
          row.data.grade || null,
          row.data.arrival_date,
          row.data.available_quantity,
          row.data.initial_quantity || row.data.available_quantity,
          row.data.species || null,
          row.data.strain || null,
          row.data.age_weeks || null,
          row.data.weight_grams || null,
          row.data.health_status || 'good',
          row.data.quarantine_status || 'pending',
          row.data.notes || null,
        ];

        const result = await client.query(insertQuery, values);
        const batchId = result.rows[0].id;

        await this.logSyncAudit(client, syncJobId, 'broodstock_batch', batchId, row.rowNumber, row.data);

        await client.query('COMMIT');
        inserted++;
      } catch (error: any) {
        await client.query('ROLLBACK');

        errors.push({
          rowNumber: row.rowNumber,
          sheetName: 'Batches',
          entityType: 'broodstock_batch',
          errorType: 'database_error',
          errorMessage: error.message,
          dataSnapshot: row.data,
        });
      }
    }

    console.log(`  ✅ Batches synced: ${inserted} inserted, ${skipped} skipped`);

    return {
      processed: parsedRows.length,
      inserted,
      skipped,
      errors,
    };
  }

  /**
   * Sync orders from Google Sheets
   */
  private async syncOrders(
    sheetsService: any,
    sheetId: string,
    range: string,
    client: any,
    syncJobId: string
  ): Promise<{ processed: number; inserted: number; skipped: number; errors: ValidationError[] }> {
    console.log(`📊 Syncing orders from ${range}...`);

    const rawRows = await sheetsService.readRange(sheetId, range);
    const parsedRows = sheetsService.parseOrderRows(rawRows);

    console.log(`  Found ${parsedRows.length} order rows`);

    const { validRows, errors } = validationService.validateOrderRows(parsedRows);

    console.log(`  Valid: ${validRows.length}, Errors: ${errors.length}`);

    let inserted = 0;
    let skipped = 0;

    for (const row of validRows) {
      try {
        await client.query('BEGIN');

        // Lookup customer_id from email
        const customerResult = await client.query(
          'SELECT id FROM customers WHERE LOWER(email) = LOWER($1)',
          [row.data.customer_email]
        );

        if (customerResult.rows.length === 0) {
          errors.push({
            rowNumber: row.rowNumber,
            sheetName: 'Orders',
            entityType: 'order',
            errorType: 'missing_reference',
            errorMessage: `Customer with email ${row.data.customer_email} not found`,
            fieldName: 'customer_email',
            invalidValue: row.data.customer_email,
            dataSnapshot: row.data,
          });
          await client.query('ROLLBACK');
          continue;
        }

        const customerId = customerResult.rows[0].id;

        // Lookup broodstock_batch_id from batch_code (optional)
        let batchId = null;
        if (row.data.broodstock_batch_code) {
          const batchResult = await client.query(
            'SELECT id FROM broodstock_batches WHERE batch_code = $1',
            [row.data.broodstock_batch_code]
          );

          if (batchResult.rows.length === 0) {
            errors.push({
              rowNumber: row.rowNumber,
              sheetName: 'Orders',
              entityType: 'order',
              errorType: 'missing_reference',
              errorMessage: `Batch with code ${row.data.broodstock_batch_code} not found`,
              fieldName: 'broodstock_batch_code',
              invalidValue: row.data.broodstock_batch_code,
              dataSnapshot: row.data,
            });
            await client.query('ROLLBACK');
            continue;
          }

          batchId = batchResult.rows[0].id;
        }

        // Calculate total_value
        const totalValue = row.data.quantity * row.data.unit_price;

        // Insert-only dedupe: skip if an order already exists with same customer, date, species, quantity, and unit price
        const duplicateCheck = await client.query(
          `SELECT id FROM orders 
           WHERE customer_id = $1
             AND order_date = $2
             AND species = $3
             AND quantity = $4
             AND unit_price = $5`,
          [customerId, row.data.order_date, row.data.species, row.data.quantity, row.data.unit_price]
        );

        if (duplicateCheck.rows.length > 0) {
          skipped++;
          await client.query('ROLLBACK');
          continue;
        }

        // Generate order_number using shared utility to avoid collisions
        const orderNumber = await generateOrderNumber();

        // Insert order
        const insertQuery = `
          INSERT INTO orders (
            order_number, customer_id, broodstock_batch_id, order_date,
            species, strain, quantity, unit_price, unit_price_currency,
            total_value, total_value_currency, unit, packaging_type,
            shipment_date, shipment_status, quality_flag, mortality_reported, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
          RETURNING id
        `;

        const values = [
          orderNumber,
          customerId,
          batchId,
          row.data.order_date,
          row.data.species,
          row.data.strain || null,
          row.data.quantity,
          row.data.unit_price,
          row.data.unit_price_currency || 'USD',
          totalValue,
          row.data.total_value_currency || 'USD',
          row.data.unit || 'piece',
          row.data.packaging_type || null,
          row.data.shipment_date || null,
          row.data.shipment_status || 'pending',
          row.data.quality_flag || 'ok',
          row.data.mortality_reported || 0,
          row.data.notes || null,
        ];

        const result = await client.query(insertQuery, values);
        const orderId = result.rows[0].id;

        await this.logSyncAudit(client, syncJobId, 'order', orderId, row.rowNumber, row.data);

        await client.query('COMMIT');
        inserted++;
      } catch (error: any) {
        await client.query('ROLLBACK');

        errors.push({
          rowNumber: row.rowNumber,
          sheetName: 'Orders',
          entityType: 'order',
          errorType: 'database_error',
          errorMessage: error.message,
          dataSnapshot: row.data,
        });
      }
    }

    console.log(`  ✅ Orders synced: ${inserted} inserted, ${skipped} skipped`);

    return {
      processed: parsedRows.length,
      inserted,
      skipped,
      errors,
    };
  }

  /**
   * Get sync configuration from database
   */
  private async getSyncConfig(): Promise<any> {
    const envDefaults = {
      enabled: (process.env.GOOGLE_SHEETS_ENABLED || 'false').toLowerCase() === 'true',
      masterSheetId: process.env.GOOGLE_SHEETS_MASTER_SHEET_ID || '',
      credentialsPath: process.env.GOOGLE_SHEETS_CREDENTIALS_PATH || '',
      customerRange: process.env.GOOGLE_SHEETS_CUSTOMER_RANGE || '',
      orderRange: process.env.GOOGLE_SHEETS_ORDER_RANGE || '',
      batchRange: process.env.GOOGLE_SHEETS_BATCH_RANGE || '',
    };

    const result = await pool.query(`
      SELECT config_key, config_value
      FROM sync_config
      WHERE config_key IN (
        'google_sheets_enabled',
        'google_sheets_master_sheet_id',
        'google_sheets_credentials_path',
        'google_sheets_customer_range',
        'google_sheets_order_range',
        'google_sheets_batch_range'
      )
    `);

    const config: any = { ...envDefaults };
    result.rows.forEach(row => {
      if (row.config_key === 'google_sheets_enabled') {
        config.enabled = row.config_value === 'true';
      } else if (row.config_key === 'google_sheets_master_sheet_id') {
        config.masterSheetId = row.config_value || config.masterSheetId;
      } else if (row.config_key === 'google_sheets_credentials_path') {
        config.credentialsPath = row.config_value || config.credentialsPath;
      } else if (row.config_key === 'google_sheets_customer_range') {
        config.customerRange = row.config_value || config.customerRange;
      } else if (row.config_key === 'google_sheets_order_range') {
        config.orderRange = row.config_value || config.orderRange;
      } else if (row.config_key === 'google_sheets_batch_range') {
        config.batchRange = row.config_value || config.batchRange;
      }
    });

    return config;
  }

  /**
   * Create a new sync job
   */
  private async createSyncJob(input: CreateSyncJobInput): Promise<SyncJob> {
    const query = `
      INSERT INTO sync_jobs (source, status, triggered_by, metadata)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      input.source,
      'pending',
      input.triggered_by,
      JSON.stringify(input.metadata || {}),
    ];

    const result = await pool.query(query, values);
    return this.mapSyncJobRow(result.rows[0]);
  }

  /**
   * Update sync job
   */
  private async updateSyncJob(jobId: string, updates: UpdateSyncJobInput): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.completed_at !== undefined) {
      fields.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completed_at);
    }

    if (updates.records_processed !== undefined) {
      fields.push(`records_processed = $${paramIndex++}`);
      values.push(updates.records_processed);
    }

    if (updates.records_inserted !== undefined) {
      fields.push(`records_inserted = $${paramIndex++}`);
      values.push(updates.records_inserted);
    }

    if (updates.records_skipped !== undefined) {
      fields.push(`records_skipped = $${paramIndex++}`);
      values.push(updates.records_skipped);
    }

    if (updates.records_failed !== undefined) {
      fields.push(`records_failed = $${paramIndex++}`);
      values.push(updates.records_failed);
    }

    if (updates.customers_inserted !== undefined) {
      fields.push(`customers_inserted = $${paramIndex++}`);
      values.push(updates.customers_inserted);
    }

    if (updates.orders_inserted !== undefined) {
      fields.push(`orders_inserted = $${paramIndex++}`);
      values.push(updates.orders_inserted);
    }

    if (updates.batches_inserted !== undefined) {
      fields.push(`batches_inserted = $${paramIndex++}`);
      values.push(updates.batches_inserted);
    }

    if (updates.error_summary !== undefined) {
      fields.push(`error_summary = $${paramIndex++}`);
      values.push(JSON.stringify(updates.error_summary));
    }

    if (updates.error_message !== undefined) {
      fields.push(`error_message = $${paramIndex++}`);
      values.push(updates.error_message);
    }

    if (fields.length === 0) {
      return;
    }

    values.push(jobId);

    const query = `
      UPDATE sync_jobs
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
    `;

    await pool.query(query, values);
  }

  /**
   * Save sync errors to database
   */
  private async saveSyncErrors(syncJobId: string, errors: ValidationError[]): Promise<void> {
    if (errors.length === 0) return;

    const query = `
      INSERT INTO sync_errors (
        sync_job_id, row_number, sheet_name, entity_type,
        error_type, error_message, field_name, invalid_value, data_snapshot
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `;

    for (const error of errors) {
      await pool.query(query, [
        syncJobId,
        error.rowNumber,
        error.sheetName,
        error.entityType,
        error.errorType,
        error.errorMessage,
        error.fieldName || null,
        error.invalidValue || null,
        JSON.stringify(error.dataSnapshot),
      ]);
    }
  }

  /**
   * Log sync audit trail
   */
  private async logSyncAudit(
    client: any,
    syncJobId: string,
    entityType: string,
    entityId: string,
    rowNumber: number,
    dataSnapshot: any
  ): Promise<void> {
    await client.query(
      `INSERT INTO sync_audit_log (sync_job_id, entity_type, entity_id, action, row_number, data_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [syncJobId, entityType, entityId, 'insert', rowNumber, JSON.stringify(dataSnapshot)]
    );
  }

  /**
   * Get sync job by ID
   */
  async getSyncJob(jobId: string): Promise<SyncJob | null> {
    const result = await pool.query(
      'SELECT * FROM sync_jobs WHERE id = $1',
      [jobId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapSyncJobRow(result.rows[0]);
  }

  /**
   * Get sync job history with pagination
   */
  async getSyncJobHistory(filter: SyncJobFilter): Promise<{ jobs: SyncJob[]; total: number }> {
    let whereConditions: string[] = [];
    let values: any[] = [];
    let paramIndex = 1;

    if (filter.status) {
      whereConditions.push(`status = $${paramIndex++}`);
      values.push(filter.status);
    }

    if (filter.source) {
      whereConditions.push(`source = $${paramIndex++}`);
      values.push(filter.source);
    }

    if (filter.triggered_by) {
      whereConditions.push(`triggered_by = $${paramIndex++}`);
      values.push(filter.triggered_by);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sync_jobs ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM sync_jobs
      ${whereClause}
      ORDER BY ${filter.sort_by} ${filter.sort_order}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(filter.limit, filter.offset);

    const dataResult = await pool.query(dataQuery, values);

    const jobs = dataResult.rows.map(row => this.mapSyncJobRow(row));

    return { jobs, total };
  }

  /**
   * Get sync errors for a job
   */
  async getSyncErrors(filter: SyncErrorFilter): Promise<{ errors: SyncError[]; total: number }> {
    let whereConditions: string[] = ['sync_job_id = $1'];
    let values: any[] = [filter.sync_job_id];
    let paramIndex = 2;

    if (filter.entity_type) {
      whereConditions.push(`entity_type = $${paramIndex++}`);
      values.push(filter.entity_type);
    }

    if (filter.error_type) {
      whereConditions.push(`error_type = $${paramIndex++}`);
      values.push(filter.error_type);
    }

    if (filter.sheet_name) {
      whereConditions.push(`sheet_name = $${paramIndex++}`);
      values.push(filter.sheet_name);
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sync_errors WHERE ${whereClause}`,
      values
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const dataQuery = `
      SELECT * FROM sync_errors
      WHERE ${whereClause}
      ORDER BY row_number ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    values.push(filter.limit, filter.offset);

    const dataResult = await pool.query(dataQuery, values);

    const errors = dataResult.rows.map(row => this.mapSyncErrorRow(row));

    return { errors, total };
  }

  /**
   * Map database row to SyncJob object
   */
  private mapSyncJobRow(row: any): SyncJob {
    return {
      id: row.id,
      source: row.source,
      status: row.status,
      started_at: row.started_at,
      completed_at: row.completed_at,
      records_processed: row.records_processed,
      records_inserted: row.records_inserted,
      records_skipped: row.records_skipped,
      records_failed: row.records_failed,
      customers_inserted: row.customers_inserted,
      orders_inserted: row.orders_inserted,
      batches_inserted: row.batches_inserted,
      error_summary: row.error_summary,
      error_message: row.error_message,
      triggered_by: row.triggered_by,
      metadata: row.metadata,
      created_at: row.created_at,
    };
  }

  /**
   * Map database row to SyncError object
   */
  private mapSyncErrorRow(row: any): SyncError {
    return {
      id: row.id,
      sync_job_id: row.sync_job_id,
      row_number: row.row_number,
      sheet_name: row.sheet_name,
      entity_type: row.entity_type,
      error_type: row.error_type,
      error_message: row.error_message,
      field_name: row.field_name,
      invalid_value: row.invalid_value,
      data_snapshot: row.data_snapshot,
      created_at: row.created_at,
    };
  }
}

// Export singleton instance
export const syncService = new SyncService();
