import { z } from 'zod';

// Enums matching database
export const ShipmentStatus = z.enum(['pending', 'shipped', 'delivered', 'problem']);
export const QualityFlag = z.enum(['ok', 'minor_issue', 'critical_issue']);

// Test result schema
export const TestResultSchema = z.object({
  test_type: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  pass_fail: z.enum(['pass', 'fail', 'pending']),
  result_value: z.string().optional(),
  file_url: z.string().url().optional(),
  notes: z.string().optional(),
});

// File attachment schema
export const FileAttachmentSchema = z.object({
  type: z.enum(['invoice', 'photo', 'certificate', 'test_result', 'other']),
  filename: z.string(),
  original_name: z.string(),
  url: z.string().url(),
  size: z.number().min(0),
  mime_type: z.string(),
  uploaded_at: z.string().datetime(),
});

// Order validation schemas
export const CreateOrderSchema = z.object({
  customer_id: z.string().uuid(),
  broodstock_batch_id: z.string().uuid().optional(),
  order_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  species: z.string().min(1).max(255),
  strain: z.string().max(255).optional(),
  quantity: z.number().int().min(1),
  unit_price: z.number().min(0),
  unit_price_currency: z.string().length(3).default('USD'),
  total_value_currency: z.string().length(3).default('USD'),
  unit: z.string().max(50).default('piece'),
  packaging_type: z.string().max(100).optional(),
  shipment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  shipment_status: ShipmentStatus.default('pending'),
  quality_flag: QualityFlag.default('ok'),
  mortality_reported: z.number().int().min(0).default(0),
  test_results: z.array(TestResultSchema).optional(),
  files: z.array(FileAttachmentSchema).optional(),
  notes: z.string().optional(),
}).refine(data => {
  // Auto-calculate total_value
  return true;
}, {
  message: "Total value will be calculated automatically"
});

export const UpdateOrderSchema = CreateOrderSchema.partial();

export const OrderFilterSchema = z.object({
  customer_id: z.string().uuid().optional(),
  broodstock_batch_id: z.string().uuid().optional(),
  species: z.string().optional(),
  strain: z.string().optional(),
  shipment_status: ShipmentStatus.optional(),
  quality_flag: QualityFlag.optional(),
  order_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  order_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shipment_date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shipment_date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  min_quantity: z.number().int().min(0).optional(),
  max_quantity: z.number().int().min(0).optional(),
  min_value: z.number().min(0).optional(),
  max_value: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['order_date', 'total_value', 'quantity', 'customer_name', 'created_at']).default('order_date'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
  include_customer: z.boolean().default(true),
  include_batch: z.boolean().default(false),
});

// Bulk operation schemas
export const BulkUpdateStatusSchema = z.object({
  order_ids: z.array(z.string().uuid()).min(1).max(100),
  shipment_status: ShipmentStatus.optional(),
  quality_flag: QualityFlag.optional(),
  notes: z.string().optional(),
});

// Type exports
export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  broodstock_batch_id?: string;
  order_date: string;
  species: string;
  strain?: string;
  quantity: number;
  unit_price: number;
  unit_price_currency: string;
  total_value: number;
  total_value_currency: string;
  unit: string;
  packaging_type?: string;
  shipment_date?: string;
  shipped_date?: string;
  shipment_status: z.infer<typeof ShipmentStatus>;
  quality_flag: z.infer<typeof QualityFlag>;
  mortality_reported: number;
  test_results?: z.infer<typeof TestResultSchema>[];
  files?: z.infer<typeof FileAttachmentSchema>[];
  notes?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  // Related data
  customer?: {
    id: string;
    name: string;
    primary_contact_name: string;
    country?: string;
    status: string;
  };
  broodstock_batch?: {
    id: string;
    batch_code: string;
    hatchery_origin: string;
    grade?: string;
  };
  invoice?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    issued_date: string;
    paid_date?: string;
  };
};

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>;
export type OrderFilter = z.infer<typeof OrderFilterSchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;