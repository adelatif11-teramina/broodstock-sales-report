import { pool } from '../config/database';
import { ApiError } from '../middleware/errorHandler';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilter,
} from '../models/customer';
import {
  CustomerAnalytics,
  TimelineEvent,
  Warning,
  CredentialAnalytics,
  OrderSnapshot,
  InvoiceSnapshot,
  TopSpecies,
  PeriodPerformance,
} from '../models/customerAnalytics';

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
   * Get analytics snapshot for a customer
   */
  async getAnalytics(id: string): Promise<CustomerAnalytics> {
    const customer = await this.getById(id);

    if (!customer) {
      throw new ApiError('Customer not found', 404);
    }

    const client = await pool.connect();

    try {
      const summaryResult = await client.query(`
        SELECT 
          COUNT(*)::int AS total_orders,
          COALESCE(SUM(total_value), 0)::numeric AS total_value,
          COALESCE(AVG(total_value), 0)::numeric AS average_order_value,
          MAX(order_date) AS last_order_date,
          MIN(order_date) AS first_order_date,
          COUNT(*) FILTER (WHERE shipment_status != 'delivered')::int AS open_shipments,
          COUNT(*) FILTER (
            WHERE shipment_status = 'problem' 
              OR quality_flag = 'critical_issue'
          )::int AS open_issues
        FROM orders
        WHERE customer_id = $1
      `, [id]);

      const periodPerformanceResult = await client.query(`
        SELECT
          to_char(date_trunc('quarter', order_date), 'YYYY-"Q"Q') AS period,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total_value), 0)::numeric AS total_value,
          COALESCE(AVG(total_value), 0)::numeric AS average_value
        FROM orders
        WHERE customer_id = $1
        GROUP BY 1
        ORDER BY date_trunc('quarter', order_date) DESC
        LIMIT 8
      `, [id]);

      const speciesResult = await client.query(`
        SELECT
          species,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(quantity), 0)::numeric AS total_quantity,
          COALESCE(SUM(total_value), 0)::numeric AS total_value
        FROM orders
        WHERE customer_id = $1
        GROUP BY species
        ORDER BY total_value DESC
        LIMIT 5
      `, [id]);

      const orderHistoryResult = await client.query(`
        SELECT 
          id,
          order_number,
          order_date,
          shipment_status,
          quality_flag,
          total_value,
          quantity,
          species,
          strain,
          shipment_date,
          shipped_date,
          created_at,
          updated_at
        FROM orders
        WHERE customer_id = $1
        ORDER BY order_date DESC
      `, [id]);

      const invoiceSummaryResult = await client.query(`
        SELECT
          COUNT(*) FILTER (WHERE status != 'paid')::int AS outstanding_count,
          COALESCE(SUM(amount) FILTER (WHERE status != 'paid'), 0)::numeric AS outstanding_value
        FROM invoices
        WHERE order_id IN (SELECT id FROM orders WHERE customer_id = $1)
      `, [id]);

      const recentInvoicesResult = await client.query(`
        SELECT
          i.id,
          i.amount,
          i.currency,
          i.status,
          i.issued_date,
          i.paid_date,
          i.created_at
        FROM invoices i
        JOIN orders o ON o.id = i.order_id
        WHERE o.customer_id = $1
        ORDER BY i.issued_date DESC NULLS LAST, i.created_at DESC
        LIMIT 10
      `, [id]);

      const auditLogsResult = await client.query(`
        SELECT id, action, user_id, changes, timestamp
        FROM audit_logs
        WHERE entity_type = 'customer' AND entity_id = $1
        ORDER BY timestamp DESC
        LIMIT 20
      `, [id]);

      const summaryRow = summaryResult.rows[0] || {
        total_orders: 0,
        total_value: 0,
        average_order_value: 0,
        last_order_date: null,
        first_order_date: null,
        open_shipments: 0,
        open_issues: 0,
      };

      const totalOrders = parseInt(summaryRow.total_orders || 0, 10);
      const totalValue = parseFloat(summaryRow.total_value || 0);
      const averageOrderValue = totalOrders > 0 ? parseFloat(summaryRow.average_order_value || 0) : 0;
      const lastOrderDate = summaryRow.last_order_date ? new Date(summaryRow.last_order_date) : null;
      const openShipmentCount = parseInt(summaryRow.open_shipments || 0, 10);
      const openIssuesCount = parseInt(summaryRow.open_issues || 0, 10);

      const orders = orderHistoryResult.rows;

      const orderDates = orders
        .map((order: any) => new Date(order.order_date))
        .filter((date: Date) => !Number.isNaN(date.getTime()));

      const sortedOrderDates = [...orderDates].sort((a, b) => a.getTime() - b.getTime());

      let averageDaysBetweenOrders: number | null = null;
      if (sortedOrderDates.length > 1) {
        const diffs = [] as number[];
        for (let i = 1; i < sortedOrderDates.length; i += 1) {
          const diffMs = sortedOrderDates[i].getTime() - sortedOrderDates[i - 1].getTime();
          diffs.push(diffMs / (1000 * 60 * 60 * 24));
        }
        if (diffs.length > 0) {
          averageDaysBetweenOrders = diffs.reduce((sum, value) => sum + value, 0) / diffs.length;
        }
      }

      let orderFrequencyPerQuarter: number | null = null;
      if (sortedOrderDates.length > 1) {
        const totalSpanDays = (sortedOrderDates[sortedOrderDates.length - 1].getTime() - sortedOrderDates[0].getTime()) / (1000 * 60 * 60 * 24);
        const spanQuarters = Math.max(totalSpanDays / 90, 0.25);
        orderFrequencyPerQuarter = totalOrders / spanQuarters;
      }

      const now = new Date();
      const daysSinceLastOrder = lastOrderDate ? Math.round((now.getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)) : null;

      let retentionRisk: 'low' | 'medium' | 'high' = 'low';
      if (totalOrders === 0) {
        retentionRisk = 'medium';
      } else if (averageDaysBetweenOrders && daysSinceLastOrder) {
        if (daysSinceLastOrder > averageDaysBetweenOrders * 1.8) {
          retentionRisk = 'high';
        } else if (daysSinceLastOrder > averageDaysBetweenOrders * 1.2) {
          retentionRisk = 'medium';
        }
      } else if (daysSinceLastOrder && daysSinceLastOrder > 120) {
        retentionRisk = 'high';
      }

      if (openIssuesCount > 0 && retentionRisk !== 'high') {
        retentionRisk = 'medium';
      }

      const outstandingInvoiceRow = invoiceSummaryResult.rows[0] || {
        outstanding_count: 0,
        outstanding_value: 0,
      };

      const outstandingInvoiceCount = parseInt(outstandingInvoiceRow.outstanding_count || 0, 10);
      const outstandingInvoiceValue = parseFloat(outstandingInvoiceRow.outstanding_value || 0);

      const credentialAnalytics = this.buildCredentialAnalytics(customer);

      const recentOrders: OrderSnapshot[] = orders.slice(0, 5).map((order: any) => {
        const orderDateIso = order.order_date
          ? new Date(order.order_date).toISOString()
          : order.created_at
            ? new Date(order.created_at).toISOString()
            : new Date().toISOString();

        return {
          id: order.id,
          orderNumber: order.order_number,
          species: order.species,
          strain: order.strain,
          orderDate: orderDateIso,
          shipmentStatus: order.shipment_status,
          qualityFlag: order.quality_flag,
          totalValue: parseFloat(order.total_value || 0),
          quantity: parseInt(order.quantity || 0, 10),
          shipmentDate: order.shipment_date ? new Date(order.shipment_date).toISOString() : null,
          shippedDate: order.shipped_date ? new Date(order.shipped_date).toISOString() : null,
        };
      });

      const performanceByPeriod: PeriodPerformance[] = periodPerformanceResult.rows.map((row: any) => ({
        period: row.period,
        totalValue: parseFloat(row.total_value || 0),
        orderCount: parseInt(row.order_count || 0, 10),
        averageValue: parseFloat(row.average_value || 0),
      }));

      const topSpecies: TopSpecies[] = speciesResult.rows.map((row: any) => ({
        species: row.species,
        orderCount: parseInt(row.order_count || 0, 10),
        totalQuantity: parseFloat(row.total_quantity || 0),
        totalValue: parseFloat(row.total_value || 0),
      }));

      const recentInvoices: InvoiceSnapshot[] = recentInvoicesResult.rows.map((row: any) => {
        const issuedDateIso = row.issued_date
          ? new Date(row.issued_date).toISOString()
          : row.created_at
            ? new Date(row.created_at).toISOString()
            : new Date().toISOString();

        return {
          id: row.id,
          amount: parseFloat(row.amount || 0),
          currency: row.currency,
          status: row.status,
          issuedDate: issuedDateIso,
          paidDate: row.paid_date ? new Date(row.paid_date).toISOString() : null,
        };
      });

      const timeline: TimelineEvent[] = [];

      orders.slice(0, 25).forEach((order: any) => {
        const createdAt = order.created_at ? new Date(order.created_at).toISOString() : order.order_date ? new Date(order.order_date).toISOString() : new Date().toISOString();
        timeline.push({
          id: `order-${order.id}`,
          type: 'order',
          timestamp: createdAt,
          title: `Order ${order.order_number}`,
          description: `${order.quantity} units of ${order.species}`,
          relatedId: order.id,
          relatedEntity: 'order',
          severity: order.quality_flag === 'critical_issue' ? 'critical' : 'info',
          metadata: {
            shipmentStatus: order.shipment_status,
            qualityFlag: order.quality_flag,
            totalValue: parseFloat(order.total_value || 0),
          },
        });

        if (order.shipment_date) {
          timeline.push({
            id: `shipment-${order.id}-${order.shipment_date}`,
            type: 'shipment',
            timestamp: new Date(order.shipment_date).toISOString(),
            title: `Shipment planned for ${order.order_number}`,
            description: `Status: ${order.shipment_status}`,
            relatedId: order.id,
            relatedEntity: 'order',
            severity: order.shipment_status === 'problem' ? 'warning' : 'info',
          });
        }

        if (order.shipped_date) {
          timeline.push({
            id: `shipment-actual-${order.id}`,
            type: 'shipment',
            timestamp: new Date(order.shipped_date).toISOString(),
            title: `Shipment updated for ${order.order_number}`,
            description: 'Marked as shipped',
            relatedId: order.id,
            relatedEntity: 'order',
            severity: order.shipment_status === 'problem' ? 'warning' : 'info',
          });
        }
      });

      recentInvoicesResult.rows.forEach((invoice: any) => {
        if (invoice.issued_date) {
          timeline.push({
            id: `invoice-${invoice.id}`,
            type: 'invoice',
            timestamp: new Date(invoice.issued_date).toISOString(),
            title: 'Invoice issued',
            description: `${invoice.currency} ${parseFloat(invoice.amount || 0).toFixed(2)}`,
            relatedId: invoice.id,
            relatedEntity: 'invoice',
            severity: invoice.status === 'overdue' ? 'warning' : 'info',
          });
        }

        if (invoice.paid_date) {
          timeline.push({
            id: `payment-${invoice.id}`,
            type: 'payment',
            timestamp: new Date(invoice.paid_date).toISOString(),
            title: 'Invoice paid',
            description: `${invoice.currency} ${parseFloat(invoice.amount || 0).toFixed(2)}`,
            relatedId: invoice.id,
            relatedEntity: 'invoice',
            severity: 'info',
          });
        }
      });

      const credentialEvents = this.buildCredentialTimeline(customer);
      timeline.push(...credentialEvents);

      auditLogsResult.rows.forEach((log: any) => {
        timeline.push({
          id: `audit-${log.id}`,
          type: 'audit',
          timestamp: new Date(log.timestamp).toISOString(),
          title: `Customer ${log.action}`,
          description: log.changes ? JSON.stringify(log.changes) : undefined,
          relatedId: log.id,
          relatedEntity: 'audit_log',
          severity: 'info',
        });
      });

      timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const warnings: Warning[] = [];

      if (credentialAnalytics.expired > 0) {
        warnings.push({
          code: 'credentials_expired',
          message: `${credentialAnalytics.expired} credential(s) expired`,
          severity: 'critical',
        });
      } else if (credentialAnalytics.expiring > 0) {
        warnings.push({
          code: 'credentials_expiring',
          message: `${credentialAnalytics.expiring} credential(s) expiring soon`,
          severity: 'warning',
        });
      }

      if (outstandingInvoiceCount > 0) {
        warnings.push({
          code: 'outstanding_invoices',
          message: `${outstandingInvoiceCount} invoice(s) outstanding totalling ${outstandingInvoiceValue.toFixed(2)}`,
          severity: outstandingInvoiceCount > 2 ? 'critical' : 'warning',
        });
      }

      if (openIssuesCount > 0) {
        warnings.push({
          code: 'shipment_issues',
          message: `${openIssuesCount} shipment or quality issue(s) open`,
          severity: 'warning',
        });
      }

      if (retentionRisk === 'high') {
        warnings.push({
          code: 'retention_risk',
          message: 'Customer shows signs of disengagement',
          severity: 'critical',
        });
      } else if (retentionRisk === 'medium') {
        warnings.push({
          code: 'retention_watch',
          message: 'Customer requires follow-up to maintain engagement',
          severity: 'warning',
        });
      }

      const analytics: CustomerAnalytics = {
        customerId: customer.id,
        summary: {
          totalOrders,
          totalValue,
          averageOrderValue,
          lastOrderDate: lastOrderDate ? lastOrderDate.toISOString() : null,
          daysSinceLastOrder,
          averageDaysBetweenOrders,
          orderFrequencyPerQuarter,
          openShipmentCount,
          openIssuesCount,
          outstandingInvoiceValue,
          outstandingInvoiceCount,
          retentionRisk,
        },
        performanceByPeriod,
        topSpecies,
        recentOrders,
        recentInvoices,
        credentialStatus: credentialAnalytics,
        timeline,
        warnings,
      };

      return analytics;
    } finally {
      client.release();
    }
  }

  private buildCredentialAnalytics(customer: Customer): CredentialAnalytics {
    const credentials = Array.isArray(customer.credentials) ? customer.credentials : [];
    const now = new Date();

    let valid = 0;
    let expiring = 0;
    let expired = 0;
    let nextExpiry: Date | undefined;

    const credentialSummaries = credentials.map((credential: any, index: number) => {
      const expiryDate = credential.expiry_date ? new Date(credential.expiry_date) : null;
      const issuedDate = credential.issued_date ? new Date(credential.issued_date) : null;
      let status: 'valid' | 'expiring' | 'expired' = 'valid';

      if (!expiryDate || Number.isNaN(expiryDate.getTime())) {
        status = 'expired';
      } else if (expiryDate.getTime() < now.getTime()) {
        status = 'expired';
      } else {
        const daysUntilExpiry = Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry <= 30) {
          status = 'expiring';
        }
      }

      if (status === 'valid') {
        valid += 1;
      } else if (status === 'expiring') {
        expiring += 1;
      } else {
        expired += 1;
      }

      if (expiryDate && status !== 'expired') {
        if (!nextExpiry || expiryDate.getTime() < nextExpiry.getTime()) {
          nextExpiry = expiryDate;
        }
      }

      const daysUntilExpiry = expiryDate ? Math.round((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : undefined;

      return {
        id: credential.id || `credential-${index}`,
        type: credential.type,
        number: credential.number,
        status,
        issuedDate: issuedDate ? issuedDate.toISOString() : undefined,
        expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
        daysUntilExpiry,
      };
    });

    const analytics: CredentialAnalytics = {
      total: credentials.length,
      valid,
      expiring,
      expired,
      nextExpiryDate: nextExpiry ? nextExpiry.toISOString() : undefined,
      credentials: credentialSummaries,
    };

    return analytics;
  }

  private buildCredentialTimeline(customer: Customer): TimelineEvent[] {
    const credentials = Array.isArray(customer.credentials) ? customer.credentials : [];
    const events: TimelineEvent[] = [];

    credentials.forEach((credential: any, index: number) => {
      if (credential.issued_date) {
        events.push({
          id: `credential-issued-${index}`,
          type: 'credential',
          timestamp: new Date(credential.issued_date).toISOString(),
          title: `${credential.type} issued`,
          description: credential.number,
          relatedId: credential.id,
          relatedEntity: 'credential',
          severity: 'info',
        });
      }

      if (credential.expiry_date) {
        const expiry = new Date(credential.expiry_date);
        const severity = expiry.getTime() < Date.now() ? 'critical' : 'warning';
        events.push({
          id: `credential-expiry-${index}`,
          type: 'credential',
          timestamp: expiry.toISOString(),
          title: `${credential.type} expiry`,
          description: credential.number,
          relatedId: credential.id,
          relatedEntity: 'credential',
          severity,
        });
      }
    });

    return events;
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
