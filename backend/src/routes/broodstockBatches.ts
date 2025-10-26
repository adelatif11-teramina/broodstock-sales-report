import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { broodstockBatchService } from '../services/broodstockBatchService';
import {
  CreateBroodstockBatchSchema,
  UpdateBroodstockBatchSchema,
  BroodstockBatchFilterSchema,
} from '../models/broodstockBatch';

const router = Router();

// All broodstock batch routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/broodstock-batches
 * Search and list broodstock batches with filters
 */
router.get('/', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter = BroodstockBatchFilterSchema.parse(req.query);
  const result = await broodstockBatchService.search(filter);

  res.json({
    success: true,
    data: {
      batches: result.batches,
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
 * GET /api/v1/broodstock-batches/available
 * Get only available batches (quantity > 0)
 */
router.get('/available', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const filter = BroodstockBatchFilterSchema.parse({ 
    ...req.query, 
    available_only: true,
    sort_by: 'arrival_date',
    sort_order: 'desc'
  });
  
  const result = await broodstockBatchService.search(filter);

  res.json({
    success: true,
    data: {
      batches: result.batches,
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
 * GET /api/v1/broodstock-batches/low-stock
 * Get batches with low stock
 */
router.get('/low-stock', 
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      threshold: z.coerce.number().min(1).max(1000).default(10),
    });

    const params = schema.parse(req.query);
    const batches = await broodstockBatchService.getLowStockBatches(params.threshold);

    res.json({
      success: true,
      data: {
        batches,
        threshold: params.threshold,
        count: batches.length,
      },
    });
  })
);

/**
 * GET /api/v1/broodstock-batches/stats
 * Get batch statistics
 */
router.get('/stats', 
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const stats = await broodstockBatchService.getBatchStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/v1/broodstock-batches/:id
 * Get broodstock batch by ID
 */
router.get('/:id', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const batch = await broodstockBatchService.getById(id);
  
  if (!batch) {
    throw new ApiError('Broodstock batch not found', 404);
  }

  res.json({
    success: true,
    data: { batch },
  });
}));

/**
 * POST /api/v1/broodstock-batches
 * Create a new broodstock batch
 */
router.post('/',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const validatedData = CreateBroodstockBatchSchema.parse(req.body);
    
    const batch = await broodstockBatchService.create(validatedData);

    res.status(201).json({
      success: true,
      message: 'Broodstock batch created successfully',
      data: { batch },
    });
  })
);

/**
 * PUT /api/v1/broodstock-batches/:id
 * Update broodstock batch
 */
router.put('/:id',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = UpdateBroodstockBatchSchema.parse(req.body);

    const batch = await broodstockBatchService.update(id, validatedData);

    res.json({
      success: true,
      message: 'Broodstock batch updated successfully',
      data: { batch },
    });
  })
);

/**
 * DELETE /api/v1/broodstock-batches/:id
 * Delete broodstock batch
 */
router.delete('/:id',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    
    await broodstockBatchService.delete(id);

    res.json({
      success: true,
      message: 'Broodstock batch deleted successfully',
    });
  })
);

/**
 * GET /api/v1/broodstock-batches/:id/available-quantity
 * Get current available quantity for a batch
 */
router.get('/:id/available-quantity', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  
  const availableQuantity = await broodstockBatchService.getAvailableQuantity(id);

  res.json({
    success: true,
    data: {
      batchId: id,
      availableQuantity,
    },
  });
}));

/**
 * PATCH /api/v1/broodstock-batches/:id/quantity
 * Adjust batch quantity (manual adjustment)
 */
router.patch('/:id/quantity',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const schema = z.object({
      adjustment: z.number().int(),
      reason: z.string().min(1).max(500),
    });

    const { adjustment, reason } = schema.parse(req.body);

    await broodstockBatchService.updateAvailableQuantity(id, adjustment);
    
    // Log the manual adjustment (could be enhanced with an audit table)
    console.log(`Manual quantity adjustment: Batch ${id}, Change: ${adjustment}, Reason: ${reason}, User: ${req.user!.id}`);

    const updatedBatch = await broodstockBatchService.getById(id);

    res.json({
      success: true,
      message: 'Batch quantity adjusted successfully',
      data: { 
        batch: updatedBatch,
        adjustment,
        reason,
      },
    });
  })
);

/**
 * GET /api/v1/broodstock-batches/export/csv
 * Export batches to CSV
 */
router.get('/export/csv',
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const filter = BroodstockBatchFilterSchema.parse(req.query);
    
    // Remove pagination for export
    const exportFilter = { ...filter, limit: 10000, offset: 0 };
    const result = await broodstockBatchService.search(exportFilter);

    // Create CSV content
    const headers = [
      'Batch Code', 'Hatchery Origin', 'Grade', 'Species', 'Strain',
      'Arrival Date', 'Initial Quantity', 'Available Quantity', 'Total Sold',
      'Utilization Rate (%)', 'Age (weeks)', 'Weight (grams)',
      'Health Status', 'Quarantine Status', 'Total Orders', 'Notes', 'Created At'
    ];

    const rows = result.batches.map(b => [
      b.batch_code,
      b.hatchery_origin,
      b.grade || '',
      b.species || '',
      b.strain || '',
      b.arrival_date,
      b.initial_quantity || 0,
      b.available_quantity,
      b.total_quantity_sold || 0,
      b.utilization_rate || 0,
      b.age_weeks || '',
      b.weight_grams || '',
      b.health_status,
      b.quarantine_status,
      b.total_orders || 0,
      b.notes || '',
      new Date(b.created_at).toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="broodstock_batches_${Date.now()}.csv"`);
    res.send(csvContent);
  })
);

/**
 * GET /api/v1/broodstock-batches/hatcheries/list
 * Get unique list of hatchery origins
 */
router.get('/hatcheries/list', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = `
    SELECT DISTINCT hatchery_origin 
    FROM broodstock_batches 
    ORDER BY hatchery_origin ASC
  `;

  const result = await pool.query(query);
  const hatcheries = result.rows.map(row => row.hatchery_origin);

  res.json({
    success: true,
    data: {
      hatcheries,
      count: hatcheries.length,
    },
  });
}));

/**
 * GET /api/v1/broodstock-batches/species/list
 * Get unique list of species
 */
router.get('/species/list', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const query = `
    SELECT DISTINCT species 
    FROM broodstock_batches 
    WHERE species IS NOT NULL
    ORDER BY species ASC
  `;

  const result = await pool.query(query);
  const species = result.rows.map(row => row.species);

  res.json({
    success: true,
    data: {
      species,
      count: species.length,
    },
  });
}));

// Import pool for direct queries
import { pool } from '../config/database';

export default router;