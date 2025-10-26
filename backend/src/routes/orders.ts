import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { orderService } from '../services/orderService';
import { pool } from '../config/database';
import {
  CreateOrderSchema,
  UpdateOrderSchema,
  OrderFilterSchema,
  BulkUpdateStatusSchema,
} from '../models/order';

const router = Router();

// All order routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/orders
 * Search and list orders with filters
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter = OrderFilterSchema.parse(req.query);
  const result = await orderService.search(filter);

  res.json({
    success: true,
    data: {
      orders: result.orders,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        pages: Math.ceil(result.total / filter.limit),
      },
      filters: filter,
    },
  });
}));

/**
 * GET /api/v1/orders/stats/summary
 * Get order statistics summary
 */
router.get('/stats/summary', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = `
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_value) as total_revenue,
      AVG(total_value) as avg_order_value,
      SUM(quantity) as total_quantity,
      COUNT(CASE WHEN shipment_status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN shipment_status = 'shipped' THEN 1 END) as shipped_orders,
      COUNT(CASE WHEN shipment_status = 'delivered' THEN 1 END) as delivered_orders,
      COUNT(CASE WHEN shipment_status = 'problem' THEN 1 END) as problem_orders,
      COUNT(CASE WHEN quality_flag = 'critical_issue' THEN 1 END) as critical_quality_issues,
      COUNT(CASE WHEN quality_flag = 'minor_issue' THEN 1 END) as minor_quality_issues,
      COUNT(DISTINCT customer_id) as unique_customers,
      COUNT(DISTINCT species) as species_count
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
  `;

  const result = await pool.query(query);
  const stats = result.rows[0];

  res.json({
    success: true,
    data: {
      totalOrders: parseInt(stats.total_orders),
      totalRevenue: parseFloat(stats.total_revenue || 0),
      avgOrderValue: parseFloat(stats.avg_order_value || 0),
      totalQuantity: parseInt(stats.total_quantity || 0),
      pendingOrders: parseInt(stats.pending_orders),
      shippedOrders: parseInt(stats.shipped_orders),
      deliveredOrders: parseInt(stats.delivered_orders),
      problemOrders: parseInt(stats.problem_orders),
      criticalQualityIssues: parseInt(stats.critical_quality_issues),
      minorQualityIssues: parseInt(stats.minor_quality_issues),
      uniqueCustomers: parseInt(stats.unique_customers),
      speciesCount: parseInt(stats.species_count),
      period: 'last_30_days',
    },
  });
}));

/**
 * GET /api/v1/orders/stats/revenue-by-month
 * Get revenue breakdown by month
 */
router.get('/stats/revenue-by-month', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    months: z.coerce.number().min(1).max(24).default(12),
  });

  const params = schema.parse(req.query);

  const query = `
    SELECT 
      DATE_TRUNC('month', order_date) as month,
      SUM(total_value) as revenue,
      COUNT(*) as order_count,
      SUM(quantity) as total_quantity
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '${params.months} months'
    GROUP BY DATE_TRUNC('month', order_date)
    ORDER BY month ASC
  `;

  const result = await pool.query(query);

  res.json({
    success: true,
    data: {
      revenueByMonth: result.rows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue),
        orderCount: parseInt(row.order_count),
        totalQuantity: parseInt(row.total_quantity),
      })),
      period: `last_${params.months}_months`,
    },
  });
}));

/**
 * GET /api/v1/orders/stats/top-species
 * Get top selling species
 */
router.get('/stats/top-species', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    limit: z.coerce.number().min(1).max(50).default(10),
    period_days: z.coerce.number().min(1).max(365).default(30),
  });

  const params = schema.parse(req.query);

  const query = `
    SELECT 
      species,
      COUNT(*) as order_count,
      SUM(quantity) as total_quantity,
      SUM(total_value) as total_revenue,
      AVG(total_value) as avg_order_value
    FROM orders
    WHERE order_date >= CURRENT_DATE - INTERVAL '${params.period_days} days'
    GROUP BY species
    ORDER BY total_revenue DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [params.limit]);

  res.json({
    success: true,
    data: {
      topSpecies: result.rows.map(row => ({
        species: row.species,
        orderCount: parseInt(row.order_count),
        totalQuantity: parseInt(row.total_quantity),
        totalRevenue: parseFloat(row.total_revenue),
        avgOrderValue: parseFloat(row.avg_order_value),
      })),
      period: `last_${params.period_days}_days`,
    },
  });
}));

/**
 * GET /api/v1/orders/:id
 * Get order by ID with full details
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const order = await orderService.getById(id, true);
  
  if (!order) {
    throw new ApiError('Order not found', 404);
  }

  res.json({
    success: true,
    data: { order },
  });
}));

/**
 * POST /api/v1/orders
 * Create a new order
 */
router.post('/',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = CreateOrderSchema.parse(req.body);
    
    const order = await orderService.create(validatedData, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order },
    });
  })
);

/**
 * PUT /api/v1/orders/:id
 * Update order
 */
router.put('/:id',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = UpdateOrderSchema.parse(req.body);

    const order = await orderService.update(id, validatedData, req.user!.id);

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order },
    });
  })
);

/**
 * PATCH /api/v1/orders/bulk-update
 * Bulk update order status
 */
router.patch('/bulk-update',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = BulkUpdateStatusSchema.parse(req.body);

    const updatedCount = await orderService.bulkUpdateStatus(validatedData, req.user!.id);

    res.json({
      success: true,
      message: `${updatedCount} order(s) updated successfully`,
      data: { updatedCount },
    });
  })
);

/**
 * DELETE /api/v1/orders/:id
 * Delete order
 */
router.delete('/:id',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await orderService.delete(id);

    res.json({
      success: true,
      message: 'Order deleted successfully',
    });
  })
);

/**
 * GET /api/v1/orders/export/csv
 * Export orders to CSV
 */
router.get('/export/csv',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = OrderFilterSchema.parse(req.query);
    
    // Remove pagination for export
    const exportFilter = { 
      ...filter, 
      limit: 10000, 
      offset: 0,
      include_customer: true,
      include_batch: true,
    };
    
    const result = await orderService.search(exportFilter);

    // Create CSV content
    const headers = [
      'Order Number', 'Customer Name', 'Species', 'Strain', 'Quantity',
      'Unit Price', 'Total Value', 'Currency', 'Order Date',
      'Shipment Date', 'Shipment Status', 'Quality Flag',
      'Batch Code', 'Country', 'Notes', 'Created At'
    ];

    const rows = result.orders.map(o => [
      o.order_number,
      o.customer?.name || '',
      o.species,
      o.strain || '',
      o.quantity,
      o.unit_price,
      o.total_value,
      o.total_value_currency,
      o.order_date,
      o.shipment_date || '',
      o.shipment_status,
      o.quality_flag,
      o.broodstock_batch?.batch_code || '',
      o.customer?.country || '',
      o.notes || '',
      new Date(o.created_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="orders_${Date.now()}.csv"`);
    res.send(csvContent);
  })
);

/**
 * GET /api/v1/orders/customer/:customerId
 * Get orders for a specific customer
 */
router.get('/customer/:customerId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { customerId } = req.params;
  const filter = { 
    ...OrderFilterSchema.parse(req.query),
    customer_id: customerId,
    include_customer: false, // We already know the customer
    include_batch: true,
  };

  const result = await orderService.search(filter);

  res.json({
    success: true,
    data: {
      orders: result.orders,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        pages: Math.ceil(result.total / filter.limit),
      },
      customerId,
    },
  });
}));

/**
 * POST /api/v1/orders/:id/duplicate
 * Duplicate an existing order with modifications
 */
router.post('/:id/duplicate',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    // Get the original order
    const originalOrder = await orderService.getById(id, false);
    
    if (!originalOrder) {
      throw new ApiError('Order not found', 404);
    }

    // Parse any modifications from request body
    const modifications = UpdateOrderSchema.partial().parse(req.body);

    // Create new order data based on original
    const newOrderData = {
      customer_id: modifications.customer_id || originalOrder.customer_id,
      broodstock_batch_id: modifications.broodstock_batch_id || originalOrder.broodstock_batch_id,
      order_date: modifications.order_date || new Date().toISOString().split('T')[0],
      species: modifications.species || originalOrder.species,
      strain: modifications.strain || originalOrder.strain,
      quantity: modifications.quantity || originalOrder.quantity,
      unit_price: modifications.unit_price || originalOrder.unit_price,
      unit_price_currency: modifications.unit_price_currency || originalOrder.unit_price_currency,
      total_value_currency: modifications.total_value_currency || originalOrder.total_value_currency,
      unit: modifications.unit || originalOrder.unit,
      packaging_type: modifications.packaging_type || originalOrder.packaging_type,
      shipment_date: modifications.shipment_date,
      shipment_status: 'pending' as const, // Always start new orders as pending
      quality_flag: 'ok' as const, // Reset quality flag
      mortality_reported: 0, // Reset mortality
      test_results: [],
      files: [],
      notes: modifications.notes,
    };

    const newOrder = await orderService.create(newOrderData, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Order duplicated successfully',
      data: { 
        order: newOrder,
        originalOrderId: id,
      },
    });
  })
);

export default router;