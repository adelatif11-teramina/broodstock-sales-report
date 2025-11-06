import { z } from 'zod';

export const TimelineEventTypeEnum = z.enum([
  'order',
  'shipment',
  'invoice',
  'payment',
  'credential',
  'note',
  'audit'
]);

export const TimelineSeverityEnum = z.enum(['info', 'warning', 'critical']);

export const TimelineEventSchema = z.object({
  id: z.string(),
  type: TimelineEventTypeEnum,
  timestamp: z.string(),
  title: z.string(),
  description: z.string().optional(),
  relatedId: z.string().optional(),
  relatedEntity: z.string().optional(),
  severity: TimelineSeverityEnum.default('info'),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export const TopSpeciesSchema = z.object({
  species: z.string(),
  orderCount: z.number(),
  totalQuantity: z.number(),
  totalValue: z.number()
});

export const PeriodPerformanceSchema = z.object({
  period: z.string(),
  totalValue: z.number(),
  orderCount: z.number(),
  averageValue: z.number()
});

export const WarningSchema = z.object({
  code: z.string(),
  message: z.string(),
  severity: TimelineSeverityEnum.default('warning')
});

export const CredentialAnalyticsSchema = z.object({
  total: z.number(),
  valid: z.number(),
  expiring: z.number(),
  expired: z.number(),
  nextExpiryDate: z.string().optional(),
  credentials: z.array(z.object({
    id: z.string().optional(),
    type: z.string(),
    number: z.string().optional(),
    status: z.enum(['valid', 'expiring', 'expired']),
    issuedDate: z.string().optional(),
    expiryDate: z.string().optional(),
    daysUntilExpiry: z.number().optional()
  }))
});

export const OrderSnapshotSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  species: z.string(),
  strain: z.string().nullable(),
  orderDate: z.string(),
  shipmentStatus: z.string(),
  qualityFlag: z.string(),
  totalValue: z.number(),
  quantity: z.number(),
  shipmentDate: z.string().nullable(),
  shippedDate: z.string().nullable()
});

export const InvoiceSnapshotSchema = z.object({
  id: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.string(),
  issuedDate: z.string(),
  paidDate: z.string().nullable()
});

export const CustomerAnalyticsSchema = z.object({
  customerId: z.string(),
  summary: z.object({
    totalOrders: z.number(),
    totalValue: z.number(),
    averageOrderValue: z.number(),
    lastOrderDate: z.string().nullable(),
    daysSinceLastOrder: z.number().nullable(),
    averageDaysBetweenOrders: z.number().nullable(),
    orderFrequencyPerQuarter: z.number().nullable(),
    openShipmentCount: z.number(),
    openIssuesCount: z.number(),
    outstandingInvoiceValue: z.number(),
    outstandingInvoiceCount: z.number(),
    retentionRisk: z.enum(['low', 'medium', 'high'])
  }),
  performanceByPeriod: z.array(PeriodPerformanceSchema),
  topSpecies: z.array(TopSpeciesSchema),
  recentOrders: z.array(OrderSnapshotSchema),
  recentInvoices: z.array(InvoiceSnapshotSchema),
  credentialStatus: CredentialAnalyticsSchema,
  timeline: z.array(TimelineEventSchema),
  warnings: z.array(WarningSchema)
});

export type TimelineEventType = z.infer<typeof TimelineEventTypeEnum>;
export type TimelineSeverity = z.infer<typeof TimelineSeverityEnum>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
export type TopSpecies = z.infer<typeof TopSpeciesSchema>;
export type PeriodPerformance = z.infer<typeof PeriodPerformanceSchema>;
export type Warning = z.infer<typeof WarningSchema>;
export type CredentialAnalytics = z.infer<typeof CredentialAnalyticsSchema>;
export type OrderSnapshot = z.infer<typeof OrderSnapshotSchema>;
export type InvoiceSnapshot = z.infer<typeof InvoiceSnapshotSchema>;
export type CustomerAnalytics = z.infer<typeof CustomerAnalyticsSchema>;
