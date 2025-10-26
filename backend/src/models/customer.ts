import { z } from 'zod';

// Enums matching database
export const CustomerStatus = z.enum(['active', 'paused', 'blacklisted']);
export const CredentialType = z.enum(['license', 'permit', 'certificate', 'registration']);

// Credential schema
export const CredentialSchema = z.object({
  type: CredentialType,
  number: z.string().min(1).max(100),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  file_url: z.string().url(),
});

// Customer validation schemas
export const CreateCustomerSchema = z.object({
  name: z.string().min(2).max(255),
  primary_contact_name: z.string().min(2).max(255),
  primary_contact_phone: z.string().max(50).optional(),
  email: z.string().email().max(255).optional(),
  address_text: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  country: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  district: z.string().max(100).optional(),
  status: CustomerStatus.default('active'),
  credentials: z.array(CredentialSchema).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerFilterSchema = z.object({
  status: CustomerStatus.optional(),
  country: z.string().optional(),
  province: z.string().optional(),
  district: z.string().optional(),
  search: z.string().optional(),
  has_valid_credentials: z.boolean().optional(),
  credential_expiring_days: z.number().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
  sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Type exports
export type Customer = {
  id: string;
  name: string;
  primary_contact_name: string;
  primary_contact_phone?: string;
  email?: string;
  address_text?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  province?: string;
  district?: string;
  status: z.infer<typeof CustomerStatus>;
  credentials?: z.infer<typeof CredentialSchema>[];
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  // Computed fields
  total_orders?: number;
  total_value?: number;
  last_order_date?: Date;
  credential_status?: 'valid' | 'expiring' | 'expired' | 'missing';
};

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type CustomerFilter = z.infer<typeof CustomerFilterSchema>;