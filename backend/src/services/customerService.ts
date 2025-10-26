import { pool } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from '../models/customer';

export class CustomerService {
  /**
   * Create a new customer
   */
  async create(data: CreateCustomerInput, userId: string): Promise<Customer> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create point from coordinates if provided
      let locationPoint = null;
      if (data.latitude && data.longitude) {
        locationPoint = `POINT(${data.longitude} ${data.latitude})`;
      }

      const query = `
        INSERT INTO customers (
          name, primary_contact_name, primary_contact_phone, email,
          address_text, location, country, province, district,
          status, credentials, created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          ${locationPoint ? `ST_SetSRID(ST_GeomFromText($6), 4326)` : '$6'},
          $7, $8, $9, $10, $11::jsonb, $12
        )
        RETURNING 
          id, name, primary_contact_name, primary_contact_phone, email,
          address_text, ST_X(location) as longitude, ST_Y(location) as latitude,
          country, province, district, status, credentials, 
          created_by, created_at, updated_at
      `;

      const values = [
        data.name,
        data.primary_contact_name,
        data.primary_contact_phone || null,
        data.email || null,
        data.address_text || null,
        locationPoint,
        data.country || null,
        data.province || null,
        data.district || null,
        data.status || 'active',
        data.credentials ? JSON.stringify(data.credentials) : null,
        userId,
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      return this.mapCustomerFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      
      if (error instanceof Error && error.message.includes('duplicate')) {
        throw new ApiError('Customer with similar details already exists', 409);
      }
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<Customer | null> {
    const query = `
      SELECT 
        c.id, c.name, c.primary_contact_name, c.primary_contact_phone, c.email,
        c.address_text, ST_X(c.location) as longitude, ST_Y(c.location) as latitude,
        c.country, c.province, c.district, c.status, c.credentials,
        c.created_by, c.created_at, c.updated_at,
        COUNT(DISTINCT o.id) as total_orders,
        SUM(o.total_value) as total_value,
        MAX(o.order_date) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      WHERE c.id = $1
      GROUP BY c.id
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapCustomerFromDb(result.rows[0]);
  }

  /**
   * Update customer
   */
  async update(id: string, data: UpdateCustomerInput, userId: string): Promise<Customer> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCounter = 1;

      if (data.name !== undefined) {
        updateFields.push(`name = $${paramCounter}`);
        values.push(data.name);
        paramCounter++;
      }

      if (data.primary_contact_name !== undefined) {
        updateFields.push(`primary_contact_name = $${paramCounter}`);
        values.push(data.primary_contact_name);
        paramCounter++;
      }

      if (data.primary_contact_phone !== undefined) {
        updateFields.push(`primary_contact_phone = $${paramCounter}`);
        values.push(data.primary_contact_phone);
        paramCounter++;
      }

      if (data.email !== undefined) {
        updateFields.push(`email = $${paramCounter}`);
        values.push(data.email);
        paramCounter++;
      }

      if (data.address_text !== undefined) {
        updateFields.push(`address_text = $${paramCounter}`);
        values.push(data.address_text);
        paramCounter++;
      }

      if (data.latitude !== undefined && data.longitude !== undefined) {
        updateFields.push(`location = ST_SetSRID(ST_MakePoint($${paramCounter}, $${paramCounter + 1}), 4326)`);
        values.push(data.longitude, data.latitude);
        paramCounter += 2;
      }

      if (data.country !== undefined) {
        updateFields.push(`country = $${paramCounter}`);
        values.push(data.country);
        paramCounter++;
      }

      if (data.province !== undefined) {
        updateFields.push(`province = $${paramCounter}`);
        values.push(data.province);
        paramCounter++;
      }

      if (data.district !== undefined) {
        updateFields.push(`district = $${paramCounter}`);
        values.push(data.district);
        paramCounter++;
      }

      if (data.status !== undefined) {
        updateFields.push(`status = $${paramCounter}`);
        values.push(data.status);
        paramCounter++;
      }

      if (data.credentials !== undefined) {
        updateFields.push(`credentials = $${paramCounter}::jsonb`);
        values.push(JSON.stringify(data.credentials));
        paramCounter++;
      }

      if (updateFields.length === 0) {
        throw new ApiError('No fields to update', 400);
      }

      // Add ID to values
      values.push(id);

      const updateQuery = `
        UPDATE customers
        SET ${updateFields.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCounter}
        RETURNING 
          id, name, primary_contact_name, primary_contact_phone, email,
          address_text, ST_X(location) as longitude, ST_Y(location) as latitude,
          country, province, district, status, credentials,
          created_by, created_at, updated_at
      `;

      const result = await client.query(updateQuery, values);
      
      if (result.rows.length === 0) {
        throw new ApiError('Customer not found', 404);
      }

      await client.query('COMMIT');
      return this.mapCustomerFromDb(result.rows[0]);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete customer (soft delete by setting status to blacklisted)
   */
  async delete(id: string): Promise<void> {
    const query = `
      UPDATE customers
      SET status = 'blacklisted', updated_at = NOW()
      WHERE id = $1
      RETURNING id
    `;

    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new ApiError('Customer not found', 404);
    }
  }

  /**
   * Search and filter customers
   */
  async search(filter: CustomerFilter): Promise<{ customers: Customer[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Build filter conditions
    if (filter.status) {
      conditions.push(`c.status = $${paramCounter}`);
      values.push(filter.status);
      paramCounter++;
    }

    if (filter.country) {
      conditions.push(`c.country = $${paramCounter}`);
      values.push(filter.country);
      paramCounter++;
    }

    if (filter.province) {
      conditions.push(`c.province = $${paramCounter}`);
      values.push(filter.province);
      paramCounter++;
    }

    if (filter.district) {
      conditions.push(`c.district = $${paramCounter}`);
      values.push(filter.district);
      paramCounter++;
    }

    if (filter.search) {
      conditions.push(`(
        c.name ILIKE $${paramCounter} OR 
        c.primary_contact_name ILIKE $${paramCounter} OR
        c.email ILIKE $${paramCounter} OR
        c.primary_contact_phone ILIKE $${paramCounter}
      )`);
      values.push(`%${filter.search}%`);
      paramCounter++;
    }

    if (filter.has_valid_credentials !== undefined) {
      if (filter.has_valid_credentials) {
        conditions.push(`(
          c.credentials IS NOT NULL AND 
          EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.credentials) AS cred
            WHERE (cred->>'expiry_date')::date > CURRENT_DATE
          )
        )`);
      } else {
        conditions.push(`(
          c.credentials IS NULL OR 
          NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.credentials) AS cred
            WHERE (cred->>'expiry_date')::date > CURRENT_DATE
          )
        )`);
      }
    }

    if (filter.credential_expiring_days) {
      conditions.push(`
        EXISTS (
          SELECT 1 FROM jsonb_array_elements(c.credentials) AS cred
          WHERE (cred->>'expiry_date')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${filter.credential_expiring_days} days'
        )
      `);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM customers c
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results with aggregated data
    const sortColumn = filter.sort_by === 'name' ? 'c.name' : 
                      filter.sort_by === 'created_at' ? 'c.created_at' : 'c.updated_at';
    
    const dataQuery = `
      SELECT 
        c.id, c.name, c.primary_contact_name, c.primary_contact_phone, c.email,
        c.address_text, ST_X(c.location) as longitude, ST_Y(c.location) as latitude,
        c.country, c.province, c.district, c.status, c.credentials,
        c.created_by, c.created_at, c.updated_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_value), 0) as total_value,
        MAX(o.order_date) as last_order_date,
        CASE 
          WHEN c.credentials IS NULL THEN 'missing'
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.credentials) AS cred
            WHERE (cred->>'expiry_date')::date <= CURRENT_DATE
          ) THEN 'expired'
          WHEN EXISTS (
            SELECT 1 FROM jsonb_array_elements(c.credentials) AS cred
            WHERE (cred->>'expiry_date')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          ) THEN 'expiring'
          ELSE 'valid'
        END as credential_status
      FROM customers c
      LEFT JOIN orders o ON o.customer_id = c.id
      ${whereClause}
      GROUP BY c.id
      ORDER BY ${sortColumn} ${filter.sort_order}
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    values.push(filter.limit, filter.offset);
    const result = await pool.query(dataQuery, values);

    const customers = result.rows.map(row => this.mapCustomerFromDb(row));

    return { customers, total };
  }

  /**
   * Get customers near a location
   */
  async getNearbyCustomers(
    latitude: number, 
    longitude: number, 
    radiusKm: number = 50
  ): Promise<Customer[]> {
    const query = `
      SELECT 
        c.id, c.name, c.primary_contact_name, c.primary_contact_phone, c.email,
        c.address_text, ST_X(c.location) as longitude, ST_Y(c.location) as latitude,
        c.country, c.province, c.district, c.status, c.credentials,
        c.created_by, c.created_at, c.updated_at,
        ST_Distance(
          c.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) / 1000 as distance_km
      FROM customers c
      WHERE c.location IS NOT NULL
        AND c.status = 'active'
        AND ST_DWithin(
          c.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3 * 1000  -- Convert km to meters
        )
      ORDER BY distance_km ASC
    `;

    const result = await pool.query(query, [longitude, latitude, radiusKm]);
    return result.rows.map(row => this.mapCustomerFromDb(row));
  }

  /**
   * Check for duplicate customers
   */
  async checkDuplicate(
    name: string, 
    phone?: string, 
    email?: string
  ): Promise<boolean> {
    const conditions: string[] = ['name ILIKE $1'];
    const values: any[] = [name];
    let paramCounter = 2;

    if (phone) {
      conditions.push(`primary_contact_phone = $${paramCounter}`);
      values.push(phone);
      paramCounter++;
    }

    if (email) {
      conditions.push(`email = $${paramCounter}`);
      values.push(email);
      paramCounter++;
    }

    const query = `
      SELECT id FROM customers
      WHERE ${conditions.join(' OR ')}
      LIMIT 1
    `;

    const result = await pool.query(query, values);
    return result.rows.length > 0;
  }

  /**
   * Map database row to Customer object
   */
  private mapCustomerFromDb(row: any): Customer {
    return {
      id: row.id,
      name: row.name,
      primary_contact_name: row.primary_contact_name,
      primary_contact_phone: row.primary_contact_phone,
      email: row.email,
      address_text: row.address_text,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      country: row.country,
      province: row.province,
      district: row.district,
      status: row.status,
      credentials: row.credentials || [],
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      total_orders: parseInt(row.total_orders || 0),
      total_value: parseFloat(row.total_value || 0),
      last_order_date: row.last_order_date,
      credential_status: row.credential_status,
    };
  }
}

export const customerService = new CustomerService();