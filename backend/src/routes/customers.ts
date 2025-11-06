import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { customerService } from '../services/customerService';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerFilterSchema,
} from '../models/customer';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/customers
 * Search and list customers with filters
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter = CustomerFilterSchema.parse(req.query);
  const result = await customerService.search(filter);

  res.json({
    success: true,
    data: {
      customers: result.customers,
      pagination: {
        total: result.total,
        limit: filter.limit,
        offset: filter.offset,
        pages: Math.ceil(result.total / filter.limit),
      },
    },
  });
}));

/**
 * GET /api/v1/customers/nearby
 * Get customers near a location
 */
router.get('/nearby', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    latitude: z.coerce.number().min(-90).max(90),
    longitude: z.coerce.number().min(-180).max(180),
    radius: z.coerce.number().min(1).max(1000).default(50),
  });

  const params = schema.parse(req.query);
  const customers = await customerService.getNearbyCustomers(
    params.latitude,
    params.longitude,
    params.radius
  );

  res.json({
    success: true,
    data: {
      customers,
      center: {
        latitude: params.latitude,
        longitude: params.longitude,
      },
      radius: params.radius,
    },
  });
}));

/**
 * GET /api/v1/customers/check-duplicate
 * Check if a customer already exists
 */
router.get('/check-duplicate', 
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      name: z.string().min(1),
      phone: z.string().optional(),
      email: z.string().email().optional(),
    });

    const params = schema.parse(req.query);
    const isDuplicate = await customerService.checkDuplicate(
      params.name,
      params.phone,
      params.email
    );

    res.json({
      success: true,
      data: {
        isDuplicate,
      },
    });
  })
);

/**
 * GET /api/v1/customers/:id/analytics
 * Get aggregated analytics for a customer
 */
router.get('/:id/analytics', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const analytics = await customerService.getAnalytics(id);

  res.json({
    success: true,
    data: { analytics },
  });
}));

/**
 * GET /api/v1/customers/:id
 * Get customer by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const customer = await customerService.getById(id);
  
  if (!customer) {
    throw new ApiError('Customer not found', 404);
  }

  res.json({
    success: true,
    data: { customer },
  });
}));

/**
 * POST /api/v1/customers
 * Create a new customer
 */
router.post('/',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = CreateCustomerSchema.parse(req.body);
    
    // Check for duplicates
    const isDuplicate = await customerService.checkDuplicate(
      validatedData.name,
      validatedData.primary_contact_phone,
      validatedData.email
    );

    if (isDuplicate) {
      throw new ApiError('Customer with similar details already exists', 409);
    }

    const customer = await customerService.create(validatedData, req.user!.id);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: { customer },
    });
  })
);

/**
 * PUT /api/v1/customers/:id
 * Update customer
 */
router.put('/:id',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = UpdateCustomerSchema.parse(req.body);

    const customer = await customerService.update(id, validatedData, req.user!.id);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: { customer },
    });
  })
);

/**
 * DELETE /api/v1/customers/:id
 * Delete customer (soft delete)
 */
router.delete('/:id',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await customerService.delete(id);

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  })
);

/**
 * GET /api/v1/customers/stats/summary
 * Get customer statistics summary
 */
router.get('/stats/summary', 
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = `
      SELECT 
        COUNT(*) as total_customers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
        COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_customers,
        COUNT(CASE WHEN status = 'blacklisted' THEN 1 END) as blacklisted_customers,
        COUNT(CASE 
          WHEN credentials IS NOT NULL AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(credentials) AS cred
            WHERE (cred->>'expiry_date')::date > CURRENT_DATE
          ) THEN 1 
        END) as customers_with_valid_credentials,
        COUNT(CASE 
          WHEN credentials IS NOT NULL AND EXISTS (
            SELECT 1 FROM jsonb_array_elements(credentials) AS cred
            WHERE (cred->>'expiry_date')::date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
          ) THEN 1 
        END) as customers_with_expiring_credentials
      FROM customers
    `;

    const result = await pool.query(query);
    const stats = result.rows[0];

    res.json({
      success: true,
      data: {
        totalCustomers: parseInt(stats.total_customers),
        activeCustomers: parseInt(stats.active_customers),
        pausedCustomers: parseInt(stats.paused_customers),
        blacklistedCustomers: parseInt(stats.blacklisted_customers),
        customersWithValidCredentials: parseInt(stats.customers_with_valid_credentials),
        customersWithExpiringCredentials: parseInt(stats.customers_with_expiring_credentials),
      },
    });
  })
);

/**
 * GET /api/v1/customers/export
 * Export customers to CSV
 */
router.get('/export/csv',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = CustomerFilterSchema.parse(req.query);
    
    // Remove pagination for export
    const exportFilter = { ...filter, limit: 10000, offset: 0 };
    const result = await customerService.search(exportFilter);

    // Create CSV content
    const headers = [
      'ID', 'Name', 'Contact Name', 'Phone', 'Email',
      'Country', 'Province', 'District', 'Status',
      'Total Orders', 'Total Value', 'Last Order Date',
      'Credential Status', 'Created At'
    ];

    const rows = result.customers.map(c => [
      c.id,
      c.name,
      c.primary_contact_name,
      c.primary_contact_phone || '',
      c.email || '',
      c.country || '',
      c.province || '',
      c.district || '',
      c.status,
      c.total_orders || 0,
      c.total_value || 0,
      c.last_order_date ? new Date(c.last_order_date).toISOString().split('T')[0] : '',
      c.credential_status || 'missing',
      new Date(c.created_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="customers_${Date.now()}.csv"`);
    res.send(csvContent);
  })
);

// Import pool for stats query
import { pool } from '../config/database';

export default router;
