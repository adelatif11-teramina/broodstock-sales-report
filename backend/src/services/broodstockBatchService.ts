import { pool } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  BroodstockBatch,
  CreateBroodstockBatchInput,
  UpdateBroodstockBatchInput,
  BroodstockBatchFilter,
} from '../models/broodstockBatch';

export class BroodstockBatchService {
  /**
   * Create a new broodstock batch
   */
  async create(data: CreateBroodstockBatchInput): Promise<BroodstockBatch> {
    // Check if batch code already exists
    const existingBatch = await pool.query(
      'SELECT id FROM broodstock_batches WHERE batch_code = $1',
      [data.batch_code]
    );

    if (existingBatch.rows.length > 0) {
      throw new ApiError('Batch code already exists', 409);
    }

    const query = `
      INSERT INTO broodstock_batches (
        batch_code, hatchery_origin, grade, arrival_date, available_quantity,
        initial_quantity, species, strain, age_weeks, weight_grams,
        health_status, quarantine_status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING *
    `;

    const values = [
      data.batch_code,
      data.hatchery_origin,
      data.grade || null,
      data.arrival_date,
      data.available_quantity,
      data.initial_quantity || data.available_quantity,
      data.species || null,
      data.strain || null,
      data.age_weeks || null,
      data.weight_grams || null,
      data.health_status || 'good',
      data.quarantine_status || 'pending',
      data.notes || null,
    ];

    const result = await pool.query(query, values);
    return this.mapBatchFromDb(result.rows[0]);
  }

  /**
   * Get batch by ID
   */
  async getById(id: string): Promise<BroodstockBatch | null> {
    const query = `
      SELECT 
        bb.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.quantity), 0) as total_quantity_sold,
        CASE 
          WHEN bb.initial_quantity > 0 
          THEN ROUND((COALESCE(SUM(o.quantity), 0) * 100.0 / bb.initial_quantity), 2)
          ELSE 0 
        END as utilization_rate
      FROM broodstock_batches bb
      LEFT JOIN orders o ON o.broodstock_batch_id = bb.id
      WHERE bb.id = $1
      GROUP BY bb.id
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapBatchFromDb(result.rows[0]);
  }

  /**
   * Update broodstock batch
   */
  async update(id: string, data: UpdateBroodstockBatchInput): Promise<BroodstockBatch> {
    // Check if batch code already exists (excluding current batch)
    if (data.batch_code) {
      const existingBatch = await pool.query(
        'SELECT id FROM broodstock_batches WHERE batch_code = $1 AND id != $2',
        [data.batch_code, id]
      );

      if (existingBatch.rows.length > 0) {
        throw new ApiError('Batch code already exists', 409);
      }
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    if (data.batch_code !== undefined) {
      updateFields.push(`batch_code = $${paramCounter}`);
      values.push(data.batch_code);
      paramCounter++;
    }

    if (data.hatchery_origin !== undefined) {
      updateFields.push(`hatchery_origin = $${paramCounter}`);
      values.push(data.hatchery_origin);
      paramCounter++;
    }

    if (data.grade !== undefined) {
      updateFields.push(`grade = $${paramCounter}`);
      values.push(data.grade);
      paramCounter++;
    }

    if (data.arrival_date !== undefined) {
      updateFields.push(`arrival_date = $${paramCounter}`);
      values.push(data.arrival_date);
      paramCounter++;
    }

    if (data.available_quantity !== undefined) {
      updateFields.push(`available_quantity = $${paramCounter}`);
      values.push(data.available_quantity);
      paramCounter++;
    }

    if (data.initial_quantity !== undefined) {
      updateFields.push(`initial_quantity = $${paramCounter}`);
      values.push(data.initial_quantity);
      paramCounter++;
    }

    if (data.species !== undefined) {
      updateFields.push(`species = $${paramCounter}`);
      values.push(data.species);
      paramCounter++;
    }

    if (data.strain !== undefined) {
      updateFields.push(`strain = $${paramCounter}`);
      values.push(data.strain);
      paramCounter++;
    }

    if (data.age_weeks !== undefined) {
      updateFields.push(`age_weeks = $${paramCounter}`);
      values.push(data.age_weeks);
      paramCounter++;
    }

    if (data.weight_grams !== undefined) {
      updateFields.push(`weight_grams = $${paramCounter}`);
      values.push(data.weight_grams);
      paramCounter++;
    }

    if (data.health_status !== undefined) {
      updateFields.push(`health_status = $${paramCounter}`);
      values.push(data.health_status);
      paramCounter++;
    }

    if (data.quarantine_status !== undefined) {
      updateFields.push(`quarantine_status = $${paramCounter}`);
      values.push(data.quarantine_status);
      paramCounter++;
    }

    if (data.notes !== undefined) {
      updateFields.push(`notes = $${paramCounter}`);
      values.push(data.notes);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      throw new ApiError('No fields to update', 400);
    }

    // Add ID to values
    values.push(id);

    const updateQuery = `
      UPDATE broodstock_batches
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCounter}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);
    
    if (result.rows.length === 0) {
      throw new ApiError('Broodstock batch not found', 404);
    }

    return this.mapBatchFromDb(result.rows[0]);
  }

  /**
   * Search and filter broodstock batches
   */
  async search(filter: BroodstockBatchFilter): Promise<{ batches: BroodstockBatch[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build filter conditions
    if (filter.hatchery_origin) {
      conditions.push(`bb.hatchery_origin ILIKE $${paramCounter}`);
      values.push(`%${filter.hatchery_origin}%`);
      paramCounter++;
    }

    if (filter.grade) {
      conditions.push(`bb.grade = $${paramCounter}`);
      values.push(filter.grade);
      paramCounter++;
    }

    if (filter.species) {
      conditions.push(`bb.species ILIKE $${paramCounter}`);
      values.push(`%${filter.species}%`);
      paramCounter++;
    }

    if (filter.strain) {
      conditions.push(`bb.strain ILIKE $${paramCounter}`);
      values.push(`%${filter.strain}%`);
      paramCounter++;
    }

    if (filter.health_status) {
      conditions.push(`bb.health_status = $${paramCounter}`);
      values.push(filter.health_status);
      paramCounter++;
    }

    if (filter.quarantine_status) {
      conditions.push(`bb.quarantine_status = $${paramCounter}`);
      values.push(filter.quarantine_status);
      paramCounter++;
    }

    if (filter.available_only) {
      conditions.push(`bb.available_quantity > 0`);
    }

    if (filter.arrival_date_from) {
      conditions.push(`bb.arrival_date >= $${paramCounter}`);
      values.push(filter.arrival_date_from);
      paramCounter++;
    }

    if (filter.arrival_date_to) {
      conditions.push(`bb.arrival_date <= $${paramCounter}`);
      values.push(filter.arrival_date_to);
      paramCounter++;
    }

    if (filter.min_quantity) {
      conditions.push(`bb.available_quantity >= $${paramCounter}`);
      values.push(filter.min_quantity);
      paramCounter++;
    }

    if (filter.max_quantity) {
      conditions.push(`bb.available_quantity <= $${paramCounter}`);
      values.push(filter.max_quantity);
      paramCounter++;
    }

    if (filter.search) {
      conditions.push(`(
        bb.batch_code ILIKE $${paramCounter} OR 
        bb.hatchery_origin ILIKE $${paramCounter} OR
        bb.species ILIKE $${paramCounter} OR
        bb.strain ILIKE $${paramCounter} OR
        bb.notes ILIKE $${paramCounter}
      )`);
      values.push(`%${filter.search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM broodstock_batches bb
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results with aggregated data
    const sortColumn = filter.sort_by === 'batch_code' ? 'bb.batch_code' :
                      filter.sort_by === 'arrival_date' ? 'bb.arrival_date' :
                      filter.sort_by === 'available_quantity' ? 'bb.available_quantity' : 'bb.created_at';
    
    const dataQuery = `
      SELECT 
        bb.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.quantity), 0) as total_quantity_sold,
        CASE 
          WHEN bb.initial_quantity > 0 
          THEN ROUND((COALESCE(SUM(o.quantity), 0) * 100.0 / bb.initial_quantity), 2)
          ELSE 0 
        END as utilization_rate
      FROM broodstock_batches bb
      LEFT JOIN orders o ON o.broodstock_batch_id = bb.id
      ${whereClause}
      GROUP BY bb.id
      ORDER BY ${sortColumn} ${filter.sort_order}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    values.push(filter.limit, filter.offset);
    const result = await pool.query(dataQuery, values);

    const batches = result.rows.map(row => this.mapBatchFromDb(row));

    return { batches, total };
  }

  /**
   * Delete broodstock batch
   */
  async delete(id: string): Promise<void> {
    // Check if batch has any orders
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE broodstock_batch_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      throw new ApiError('Cannot delete batch with existing orders', 400);
    }

    const result = await pool.query(
      'DELETE FROM broodstock_batches WHERE id = $1 RETURNING id',
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError('Broodstock batch not found', 404);
    }
  }

  /**
   * Get available quantity for a batch
   */
  async getAvailableQuantity(id: string): Promise<number> {
    const result = await pool.query(
      'SELECT available_quantity FROM broodstock_batches WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Broodstock batch not found', 404);
    }

    return result.rows[0].available_quantity;
  }

  /**
   * Update available quantity (used internally by order service)
   */
  async updateAvailableQuantity(id: string, quantityChange: number): Promise<void> {
    const result = await pool.query(
      `UPDATE broodstock_batches 
       SET available_quantity = available_quantity + $1, updated_at = NOW()
       WHERE id = $2 AND available_quantity + $1 >= 0
       RETURNING available_quantity`,
      [quantityChange, id]
    );

    if (result.rows.length === 0) {
      throw new ApiError('Cannot update quantity: insufficient stock or batch not found', 400);
    }
  }

  /**
   * Get batches low on stock
   */
  async getLowStockBatches(threshold: number = 10): Promise<BroodstockBatch[]> {
    const query = `
      SELECT 
        bb.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.quantity), 0) as total_quantity_sold,
        CASE 
          WHEN bb.initial_quantity > 0 
          THEN ROUND((COALESCE(SUM(o.quantity), 0) * 100.0 / bb.initial_quantity), 2)
          ELSE 0 
        END as utilization_rate
      FROM broodstock_batches bb
      LEFT JOIN orders o ON o.broodstock_batch_id = bb.id
      WHERE bb.available_quantity <= $1 AND bb.available_quantity > 0
      GROUP BY bb.id
      ORDER BY bb.available_quantity ASC
    `;

    const result = await pool.query(query, [threshold]);
    return result.rows.map(row => this.mapBatchFromDb(row));
  }

  /**
   * Get batch utilization statistics
   */
  async getBatchStats(): Promise<{
    totalBatches: number;
    activeBatches: number;
    totalInitialQuantity: number;
    totalAvailableQuantity: number;
    totalSoldQuantity: number;
    averageUtilization: number;
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_batches,
        COUNT(CASE WHEN available_quantity > 0 THEN 1 END) as active_batches,
        COALESCE(SUM(initial_quantity), 0) as total_initial_quantity,
        COALESCE(SUM(available_quantity), 0) as total_available_quantity,
        COALESCE(SUM(initial_quantity - available_quantity), 0) as total_sold_quantity,
        CASE 
          WHEN SUM(initial_quantity) > 0 
          THEN ROUND(AVG(
            CASE 
              WHEN initial_quantity > 0 
              THEN ((initial_quantity - available_quantity) * 100.0 / initial_quantity)
              ELSE 0 
            END
          ), 2)
          ELSE 0 
        END as average_utilization
      FROM broodstock_batches
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    return {
      totalBatches: parseInt(stats.total_batches),
      activeBatches: parseInt(stats.active_batches),
      totalInitialQuantity: parseInt(stats.total_initial_quantity),
      totalAvailableQuantity: parseInt(stats.total_available_quantity),
      totalSoldQuantity: parseInt(stats.total_sold_quantity),
      averageUtilization: parseFloat(stats.average_utilization),
    };
  }

  /**
   * Map database row to BroodstockBatch object
   */
  private mapBatchFromDb(row: any): BroodstockBatch {
    return {
      id: row.id,
      batch_code: row.batch_code,
      hatchery_origin: row.hatchery_origin,
      grade: row.grade,
      arrival_date: row.arrival_date,
      available_quantity: row.available_quantity,
      initial_quantity: row.initial_quantity,
      species: row.species,
      strain: row.strain,
      age_weeks: row.age_weeks,
      weight_grams: parseFloat(row.weight_grams || 0),
      health_status: row.health_status,
      quarantine_status: row.quarantine_status,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_orders: parseInt(row.total_orders || 0),
      total_quantity_sold: parseInt(row.total_quantity_sold || 0),
      utilization_rate: parseFloat(row.utilization_rate || 0),
    };
  }
}

export const broodstockBatchService = new BroodstockBatchService();