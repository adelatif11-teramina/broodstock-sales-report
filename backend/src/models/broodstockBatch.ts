import { z } from 'zod';

// Broodstock batch validation schemas
export const CreateBroodstockBatchSchema = z.object({
  batch_code: z.string().min(1).max(100),
  hatchery_origin: z.string().min(1).max(255),
  grade: z.string().max(100).optional(),
  arrival_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  available_quantity: z.number().int().min(0),
  initial_quantity: z.number().int().min(0).optional(),
  species: z.string().min(1).max(255).optional(),
  strain: z.string().max(255).optional(),
  age_weeks: z.number().min(0).optional(),
  weight_grams: z.number().min(0).optional(),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor']).default('good'),
  quarantine_status: z.enum(['pending', 'in_progress', 'completed', 'failed']).default('pending'),
  notes: z.string().optional(),
});

export const UpdateBroodstockBatchSchema = CreateBroodstockBatchSchema.partial();

export const BroodstockBatchFilterSchema = z.object({
  hatchery_origin: z.string().optional(),
  grade: z.string().optional(),
  species: z.string().optional(),
  strain: z.string().optional(),
  health_status: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  quarantine_status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
  available_only: z.boolean().default(false),
  arrival_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  arrival_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  min_quantity: z.number().int().min(0).optional(),
  max_quantity: z.number().int().min(0).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['batch_code', 'arrival_date', 'available_quantity', 'created_at']).default('arrival_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Type exports
export type BroodstockBatch = {
  id: string;
  batch_code: string;
  hatchery_origin: string;
  grade?: string;
  arrival_date: string;
  available_quantity: number;
  initial_quantity?: number;
  species?: string;
  strain?: string;
  age_weeks?: number;
  weight_grams?: number;
  health_status: 'excellent' | 'good' | 'fair' | 'poor';
  quarantine_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  notes?: string;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  total_orders?: number;
  total_quantity_sold?: number;
  utilization_rate?: number; // Percentage of batch used
};

export type CreateBroodstockBatchInput = z.infer<typeof CreateBroodstockBatchSchema>;
export type UpdateBroodstockBatchInput = z.infer<typeof UpdateBroodstockBatchSchema>;
export type BroodstockBatchFilter = z.infer<typeof BroodstockBatchFilterSchema>;