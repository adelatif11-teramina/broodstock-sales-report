import { pool } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import { generateOrderNumber } from '../utils/orderNumber';
import {
  Order,
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilter,
  BulkUpdateStatusInput,
} from '../models/order';

export class OrderService {
  /**
   * Create a new order
   */
  async create(data: CreateOrderInput, userId: string): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Generate unique order number
      const orderNumber = await generateOrderNumber();

      // Calculate total value
      const totalValue = data.quantity * data.unit_price;

      // Verify customer exists and is active
      const customerCheck = await client.query(
        'SELECT id, status FROM customers WHERE id = $1',
        [data.customer_id]
      );

      if (customerCheck.rows.length === 0) {
        throw new ApiError('Customer not found', 404);
      }

      if (customerCheck.rows[0].status === 'blacklisted') {
        throw new ApiError('Cannot create order for blacklisted customer', 400);
      }

      // Verify broodstock batch if provided
      if (data.broodstock_batch_id) {
        const batchCheck = await client.query(
          'SELECT id, available_quantity FROM broodstock_batches WHERE id = $1',
          [data.broodstock_batch_id]
        );

        if (batchCheck.rows.length === 0) {
          throw new ApiError('Broodstock batch not found', 404);
        }

        if (batchCheck.rows[0].available_quantity < data.quantity) {
          throw new ApiError('Insufficient quantity in broodstock batch', 400);
        }
      }

      const insertQuery = `
        INSERT INTO orders (
          order_number, customer_id, broodstock_batch_id, order_date,
          species, strain, quantity, unit_price, unit_price_currency,
          total_value, total_value_currency, unit, packaging_type,
          shipment_date, shipment_status, quality_flag, mortality_reported,
          test_results, files, notes, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, $19::jsonb, $20, $21
        )
        RETURNING *
      `;

      const values = [
        orderNumber,
        data.customer_id,
        data.broodstock_batch_id || null,
        data.order_date,
        data.species,
        data.strain || null,
        data.quantity,
        data.unit_price,
        data.unit_price_currency || 'USD',
        totalValue,
        data.total_value_currency || 'USD',
        data.unit || 'piece',
        data.packaging_type || null,
        data.shipment_date || null,
        data.shipment_status || 'pending',
        data.quality_flag || 'ok',
        data.mortality_reported || 0,
        data.test_results ? JSON.stringify(data.test_results) : null,
        data.files ? JSON.stringify(data.files) : null,
        data.notes || null,
        userId,
      ];

      const result = await client.query(insertQuery, values);

      // Update broodstock batch availability if applicable
      if (data.broodstock_batch_id) {
        await client.query(
          'UPDATE broodstock_batches SET available_quantity = available_quantity - $1 WHERE id = $2',
          [data.quantity, data.broodstock_batch_id]
        );
      }

      await client.query('COMMIT');

      return this.mapOrderFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get order by ID
   */
  async getById(id: string, includeRelated: boolean = true): Promise<Order | null> {
    let query = `
      SELECT o.*
      FROM orders o
      WHERE o.id = $1
    `;

    if (includeRelated) {
      query = `
        SELECT 
          o.*,
          c.id as customer_id_rel, c.name as customer_name, 
          c.primary_contact_name, c.country as customer_country, c.status as customer_status,
          bb.id as batch_id_rel, bb.batch_code, bb.hatchery_origin, bb.grade,
          i.id as invoice_id, i.amount as invoice_amount, i.currency as invoice_currency,
          i.status as invoice_status, i.issued_date, i.paid_date
        FROM orders o
        LEFT JOIN customers c ON c.id = o.customer_id
        LEFT JOIN broodstock_batches bb ON bb.id = o.broodstock_batch_id
        LEFT JOIN invoices i ON i.order_id = o.id
        WHERE o.id = $1
      `;
    }

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapOrderFromDb(result.rows[0], includeRelated);
  }

  /**
   * Update order
   */
  async update(id: string, data: UpdateOrderInput, userId: string): Promise<Order> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.customer_id !== undefined) {
        // Verify customer exists and is active
        const customerCheck = await client.query(
          'SELECT id, status FROM customers WHERE id = $1',
          [data.customer_id]
        );

        if (customerCheck.rows.length === 0) {
          throw new ApiError('Customer not found', 404);
        }

        if (customerCheck.rows[0].status === 'blacklisted') {
          throw new ApiError('Cannot assign order to blacklisted customer', 400);
        }

        updateFields.push(`customer_id = $${paramCounter}`);
        values.push(data.customer_id);
        paramCounter++;
      }

      if (data.broodstock_batch_id !== undefined) {
        if (data.broodstock_batch_id) {
          const batchCheck = await client.query(
            'SELECT id FROM broodstock_batches WHERE id = $1',
            [data.broodstock_batch_id]
          );

          if (batchCheck.rows.length === 0) {
            throw new ApiError('Broodstock batch not found', 404);
          }
        }

        updateFields.push(`broodstock_batch_id = $${paramCounter}`);
        values.push(data.broodstock_batch_id);
        paramCounter++;
      }

      if (data.order_date !== undefined) {
        updateFields.push(`order_date = $${paramCounter}`);
        values.push(data.order_date);
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

      if (data.quantity !== undefined) {
        updateFields.push(`quantity = $${paramCounter}`);
        values.push(data.quantity);
        paramCounter++;
      }

      if (data.unit_price !== undefined) {
        updateFields.push(`unit_price = $${paramCounter}`);
        values.push(data.unit_price);
        paramCounter++;
      }

      // Recalculate total_value if quantity or unit_price changed
      if (data.quantity !== undefined || data.unit_price !== undefined) {
        // Get current values to calculate new total
        const currentOrder = await client.query(
          'SELECT quantity, unit_price FROM orders WHERE id = $1',
          [id]
        );

        if (currentOrder.rows.length === 0) {
          throw new ApiError('Order not found', 404);
        }

        const newQuantity = data.quantity ?? currentOrder.rows[0].quantity;
        const newUnitPrice = data.unit_price ?? currentOrder.rows[0].unit_price;
        const newTotalValue = newQuantity * newUnitPrice;

        updateFields.push(`total_value = $${paramCounter}`);
        values.push(newTotalValue);
        paramCounter++;
      }

      if (data.unit_price_currency !== undefined) {
        updateFields.push(`unit_price_currency = $${paramCounter}`);
        values.push(data.unit_price_currency);
        paramCounter++;
      }

      if (data.total_value_currency !== undefined) {
        updateFields.push(`total_value_currency = $${paramCounter}`);
        values.push(data.total_value_currency);
        paramCounter++;
      }

      if (data.unit !== undefined) {
        updateFields.push(`unit = $${paramCounter}`);
        values.push(data.unit);
        paramCounter++;
      }

      if (data.packaging_type !== undefined) {
        updateFields.push(`packaging_type = $${paramCounter}`);
        values.push(data.packaging_type);
        paramCounter++;
      }

      if (data.shipment_date !== undefined) {
        updateFields.push(`shipment_date = $${paramCounter}`);
        values.push(data.shipment_date);
        paramCounter++;
      }

      if (data.shipment_status !== undefined) {
        updateFields.push(`shipment_status = $${paramCounter}`);
        values.push(data.shipment_status);
        paramCounter++;

        // Auto-set shipped_date when status changes to 'shipped'
        if (data.shipment_status === 'shipped') {
          updateFields.push(`shipped_date = CURRENT_DATE`);
        }
      }

      if (data.quality_flag !== undefined) {
        updateFields.push(`quality_flag = $${paramCounter}`);
        values.push(data.quality_flag);
        paramCounter++;
      }

      if (data.mortality_reported !== undefined) {
        updateFields.push(`mortality_reported = $${paramCounter}`);
        values.push(data.mortality_reported);
        paramCounter++;
      }

      if (data.test_results !== undefined) {
        updateFields.push(`test_results = $${paramCounter}::jsonb`);
        values.push(JSON.stringify(data.test_results));
        paramCounter++;
      }

      if (data.files !== undefined) {
        updateFields.push(`files = $${paramCounter}::jsonb`);
        values.push(JSON.stringify(data.files));
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
        UPDATE orders
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCounter}
        RETURNING *
      `;

      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new ApiError('Order not found', 404);
      }

      await client.query('COMMIT');
      return this.mapOrderFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Search and filter orders
   */
  async search(filter: OrderFilter): Promise<{ orders: Order[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build filter conditions
    if (filter.customer_id) {
      conditions.push(`o.customer_id = $${paramCounter}`);
      values.push(filter.customer_id);
      paramCounter++;
    }

    if (filter.broodstock_batch_id) {
      conditions.push(`o.broodstock_batch_id = $${paramCounter}`);
      values.push(filter.broodstock_batch_id);
      paramCounter++;
    }

    if (filter.species) {
      conditions.push(`o.species ILIKE $${paramCounter}`);
      values.push(`%${filter.species}%`);
      paramCounter++;
    }

    if (filter.strain) {
      conditions.push(`o.strain ILIKE $${paramCounter}`);
      values.push(`%${filter.strain}%`);
      paramCounter++;
    }

    if (filter.shipment_status) {
      conditions.push(`o.shipment_status = $${paramCounter}`);
      values.push(filter.shipment_status);
      paramCounter++;
    }

    if (filter.quality_flag) {
      conditions.push(`o.quality_flag = $${paramCounter}`);
      values.push(filter.quality_flag);
      paramCounter++;
    }

    if (filter.order_date_from) {
      conditions.push(`o.order_date >= $${paramCounter}`);
      values.push(filter.order_date_from);
      paramCounter++;
    }

    if (filter.order_date_to) {
      conditions.push(`o.order_date <= $${paramCounter}`);
      values.push(filter.order_date_to);
      paramCounter++;
    }

    if (filter.shipment_date_from) {
      conditions.push(`o.shipment_date >= $${paramCounter}`);
      values.push(filter.shipment_date_from);
      paramCounter++;
    }

    if (filter.shipment_date_to) {
      conditions.push(`o.shipment_date <= $${paramCounter}`);
      values.push(filter.shipment_date_to);
      paramCounter++;
    }

    if (filter.min_quantity) {
      conditions.push(`o.quantity >= $${paramCounter}`);
      values.push(filter.min_quantity);
      paramCounter++;
    }

    if (filter.max_quantity) {
      conditions.push(`o.quantity <= $${paramCounter}`);
      values.push(filter.max_quantity);
      paramCounter++;
    }

    if (filter.min_value) {
      conditions.push(`o.total_value >= $${paramCounter}`);
      values.push(filter.min_value);
      paramCounter++;
    }

    if (filter.max_value) {
      conditions.push(`o.total_value <= $${paramCounter}`);
      values.push(filter.max_value);
      paramCounter++;
    }

    if (filter.currency) {
      conditions.push(`o.total_value_currency = $${paramCounter}`);
      values.push(filter.currency);
      paramCounter++;
    }

    if (filter.search) {
      conditions.push(`(
        o.order_number ILIKE $${paramCounter} OR 
        o.species ILIKE $${paramCounter} OR
        o.strain ILIKE $${paramCounter} OR
        o.notes ILIKE $${paramCounter}
        ${filter.include_customer ? ' OR c.name ILIKE $' + paramCounter : ''}
      )`);
      values.push(`%${filter.search}%`);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build joins
    const joins = filter.include_customer || filter.search ? 
      'LEFT JOIN customers c ON c.id = o.customer_id' : '';

    const batchJoin = filter.include_batch ? 
      'LEFT JOIN broodstock_batches bb ON bb.id = o.broodstock_batch_id' : '';

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${joins}
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const sortColumn = filter.sort_by === 'customer_name' ? 'c.name' :
                      filter.sort_by === 'order_date' ? 'o.order_date' :
                      filter.sort_by === 'total_value' ? 'o.total_value' :
                      filter.sort_by === 'quantity' ? 'o.quantity' : 'o.created_at';
    
    const selectFields = `
      o.*
      ${filter.include_customer ? ', c.id as customer_id_rel, c.name as customer_name, c.primary_contact_name, c.country as customer_country, c.status as customer_status' : ''}
      ${filter.include_batch ? ', bb.id as batch_id_rel, bb.batch_code, bb.hatchery_origin, bb.grade' : ''}
    `;

    const dataQuery = `
      SELECT ${selectFields}
      FROM orders o
      ${joins}
      ${batchJoin}
      ${whereClause}
      ORDER BY ${sortColumn} ${filter.sort_order}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    values.push(filter.limit, filter.offset);
    const result = await pool.query(dataQuery, values);

    const orders = result.rows.map(row => this.mapOrderFromDb(row, filter.include_customer || filter.include_batch));

    return { orders, total };
  }

  /**
   * Bulk update order status
   */
  async bulkUpdateStatus(data: BulkUpdateStatusInput, userId: string): Promise<number> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.shipment_status) {
        updateFields.push(`shipment_status = $${paramCounter}`);
        values.push(data.shipment_status);
        paramCounter++;

        // Auto-set shipped_date when status changes to 'shipped'
        if (data.shipment_status === 'shipped') {
          updateFields.push(`shipped_date = CURRENT_DATE`);
        }
      }

      if (data.quality_flag) {
        updateFields.push(`quality_flag = $${paramCounter}`);
        values.push(data.quality_flag);
        paramCounter++;
      }

      if (data.notes) {
        updateFields.push(`notes = $${paramCounter}`);
        values.push(data.notes);
        paramCounter++;
      }

      if (updateFields.length === 0) {
        throw new ApiError('No fields to update', 400);
      }

      const placeholders = data.order_ids.map((_, index) => `$${paramCounter + index}`).join(',');
      values.push(...data.order_ids);

      const updateQuery = `
        UPDATE orders
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id IN (${placeholders})
      `;

      const result = await client.query(updateQuery, values);
      await client.query('COMMIT');

      return result.rowCount || 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete order (hard delete for now)
   */
  async delete(id: string): Promise<void> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get order details for potential batch quantity restoration
      const orderQuery = 'SELECT broodstock_batch_id, quantity FROM orders WHERE id = $1';
      const orderResult = await client.query(orderQuery, [id]);

      if (orderResult.rows.length === 0) {
        throw new ApiError('Order not found', 404);
      }

      const order = orderResult.rows[0];

      // Delete the order
      const deleteQuery = 'DELETE FROM orders WHERE id = $1';
      await client.query(deleteQuery, [id]);

      // Restore broodstock batch quantity if applicable
      if (order.broodstock_batch_id) {
        await client.query(
          'UPDATE broodstock_batches SET available_quantity = available_quantity + $1 WHERE id = $2',
          [order.quantity, order.broodstock_batch_id]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to Order object
   */
  private mapOrderFromDb(row: any, includeRelated: boolean = false): Order {
    const order: Order = {
      id: row.id,
      order_number: row.order_number,
      customer_id: row.customer_id,
      broodstock_batch_id: row.broodstock_batch_id,
      order_date: row.order_date,
      species: row.species,
      strain: row.strain,
      quantity: row.quantity,
      unit_price: parseFloat(row.unit_price),
      unit_price_currency: row.unit_price_currency,
      total_value: parseFloat(row.total_value),
      total_value_currency: row.total_value_currency,
      unit: row.unit,
      packaging_type: row.packaging_type,
      shipment_date: row.shipment_date,
      shipped_date: row.shipped_date,
      shipment_status: row.shipment_status,
      quality_flag: row.quality_flag,
      mortality_reported: row.mortality_reported,
      test_results: row.test_results || [],
      files: row.files || [],
      notes: row.notes,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    // Add related data if included
    if (includeRelated) {
      if (row.customer_id_rel) {
        order.customer = {
          id: row.customer_id_rel,
          name: row.customer_name,
          primary_contact_name: row.primary_contact_name,
          country: row.customer_country,
          status: row.customer_status,
        };
      }

      if (row.batch_id_rel) {
        order.broodstock_batch = {
          id: row.batch_id_rel,
          batch_code: row.batch_code,
          hatchery_origin: row.hatchery_origin,
          grade: row.grade,
        };
      }

      if (row.invoice_id) {
        order.invoice = {
          id: row.invoice_id,
          amount: parseFloat(row.invoice_amount),
          currency: row.invoice_currency,
          status: row.invoice_status,
          issued_date: row.issued_date,
          paid_date: row.paid_date,
        };
      }
    }

    return order;
  }
}

export const orderService = new OrderService();