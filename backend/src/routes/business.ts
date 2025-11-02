import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { businessLogicService } from '../utils/businessLogic';

const router = Router();

// All business logic routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/business/dashboard-stats
 * Get executive dashboard statistics and KPIs
 */
router.get('/dashboard-stats', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const timeRangeSchema = z.object({
    range: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
  });

  const { range } = timeRangeSchema.parse(req.query);
  
  // For now, return mock data since database isn't connected
  // TODO: Replace with real database queries when Railway is connected
  const mockStats = {
    revenue: {
      current: 285420,
      previous: 245800,
      change: 16.1,
      trend: 'up' as const,
    },
    customers: {
      current: 127,
      previous: 118,
      change: 7.6,
      trend: 'up' as const,
    },
    orders: {
      current: 89,
      previous: 76,
      change: 17.1,
      trend: 'up' as const,
    },
    averageOrderValue: {
      current: 3206.07,
      previous: 3234.21,
      change: -0.9,
      trend: 'down' as const,
    },
    pendingShipments: {
      current: 23,
      previous: 28,
      change: -17.9,
      trend: 'down' as const,
    },
    qualityIssues: {
      current: 2,
      previous: 5,
      change: -60,
      trend: 'down' as const,
    },
  };

  res.json({
    success: true,
    data: {
      period: range,
      stats: mockStats,
      lastUpdated: new Date().toISOString(),
    },
  });
}));

/**
 * GET /api/v1/business/revenue-analytics
 * Get revenue analytics data for charts
 */
router.get('/revenue-analytics', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const querySchema = z.object({
    range: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
    granularity: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  });

  const { range, granularity } = querySchema.parse(req.query);
  
  // Mock revenue data - TODO: Replace with real database queries
  const generateMockData = (days: number) => {
    const data = [];
    const now = new Date();
    const baseRevenue = 8500;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const randomVariation = (Math.random() - 0.5) * 2000;
      const trendMultiplier = 1 + (i / days) * 0.2; // Growth trend
      const revenue = Math.round((baseRevenue + randomVariation) * trendMultiplier);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue,
        orders: Math.floor(revenue / 95) + Math.floor(Math.random() * 10),
        customers: Math.floor(revenue / 450) + Math.floor(Math.random() * 5),
      });
    }
    return data;
  };

  const getDaysFromRange = (range: string) => {
    switch (range) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  };

  const days = getDaysFromRange(range);
  const revenueData = generateMockData(days);
  
  // Mock top products/species data
  const topSpecies = [
    { name: 'Pacific White Shrimp', revenue: 124500, orders: 45, percentage: 32.1 },
    { name: 'Tiger Shrimp', revenue: 98200, orders: 38, percentage: 25.3 },
    { name: 'Blue Shrimp', revenue: 76800, orders: 29, percentage: 19.8 },
    { name: 'Vannamei', revenue: 45200, orders: 22, percentage: 11.6 },
    { name: 'Other Species', revenue: 42900, orders: 18, percentage: 11.2 },
  ];
  
  // Mock regional data
  const regionalData = [
    { region: 'Southeast Asia', revenue: 156700, percentage: 40.4 },
    { region: 'North America', revenue: 112300, percentage: 28.9 },
    { region: 'Europe', revenue: 67800, percentage: 17.5 },
    { region: 'South America', revenue: 51200, percentage: 13.2 },
  ];

  res.json({
    success: true,
    data: {
      period: range,
      granularity,
      revenueTimeSeries: revenueData,
      topSpecies,
      regionalBreakdown: regionalData,
      summary: {
        totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
        totalOrders: revenueData.reduce((sum, item) => sum + item.orders, 0),
        averageOrderValue: revenueData.reduce((sum, item) => sum + item.revenue, 0) / revenueData.reduce((sum, item) => sum + item.orders, 0),
        growthRate: 16.2,
      },
      lastUpdated: new Date().toISOString(),
    },
  });
}));

/**
 * GET /api/v1/business/customer-locations
 * Get customer locations for geospatial mapping
 */
router.get('/customer-locations', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const querySchema = z.object({
    bounds: z.string().optional(), // "lat1,lng1,lat2,lng2" format for map bounds
    zoom: z.coerce.number().optional(),
    limit: z.coerce.number().min(1).max(1000).default(100),
  });

  const query = querySchema.parse(req.query);
  
  // Get real customer location data from database
  const { pool } = await import('../config/database');
  
  // Query customers with location data and order statistics
  const customerQuery = `
    SELECT 
      c.id,
      c.name,
      c.latitude,
      c.longitude,
      c.address_text as city,
      c.country,
      c.status,
      c.credentials,
      COALESCE(SUM(o.total_value), 0) as revenue,
      COUNT(o.id) as order_count,
      MAX(o.order_date) as last_order_date
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.latitude IS NOT NULL 
      AND c.longitude IS NOT NULL
    GROUP BY c.id, c.name, c.latitude, c.longitude, c.address_text, c.country, c.status, c.credentials
    ORDER BY revenue DESC
    LIMIT $1
  `;
  
  const result = await pool.query(customerQuery, [query.limit]);
  
  const customerLocations = result.rows.map(row => {
    // Calculate credential status from JSONB credentials
    let credentialStatus = 'missing';
    if (row.credentials && Array.isArray(row.credentials) && row.credentials.length > 0) {
      const credentials = row.credentials as Array<{ status: string; [key: string]: any }>;
      const hasExpired = credentials.some((cred: { status: string }) => cred.status === 'expired');
      const hasExpiring = credentials.some((cred: { status: string }) => cred.status === 'expiring');
      const hasValid = credentials.some((cred: { status: string }) => cred.status === 'valid');
      
      if (hasExpired) {
        credentialStatus = 'expired';
      } else if (hasExpiring) {
        credentialStatus = 'expiring';
      } else if (hasValid) {
        credentialStatus = 'valid';
      }
    }

    return {
      id: row.id,
      name: row.name,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      city: row.city || 'Unknown',
      country: row.country || 'Unknown',
      revenue: parseFloat(row.revenue) || 0,
      orderCount: parseInt(row.order_count) || 0,
      lastOrderDate: row.last_order_date || null,
      customerTier: row.revenue > 100000 ? 'enterprise' : row.revenue > 50000 ? 'premium' : row.revenue > 20000 ? 'standard' : 'basic',
      status: row.status || 'active',
      credentialStatus,
    };
  });

  // Filter by bounds if provided
  let filteredLocations = customerLocations;
  if (query.bounds) {
    const [lat1, lng1, lat2, lng2] = query.bounds.split(',').map(Number);
    filteredLocations = customerLocations.filter((location: any) => 
      location.latitude >= Math.min(lat1, lat2) &&
      location.latitude <= Math.max(lat1, lat2) &&
      location.longitude >= Math.min(lng1, lng2) &&
      location.longitude <= Math.max(lng1, lng2)
    );
  }

  // Locations are already limited by the database query

  res.json({
    success: true,
    data: {
      locations: filteredLocations,
      summary: {
        totalCustomers: filteredLocations.length,
        totalRevenue: filteredLocations.reduce((sum: number, loc: any) => sum + loc.revenue, 0),
        totalOrders: filteredLocations.reduce((sum: number, loc: any) => sum + loc.orderCount, 0),
        credentialIssues: filteredLocations.filter((loc: any) => loc.credentialStatus !== 'valid').length,
      },
      lastUpdated: new Date().toISOString(),
    },
  });
}));

/**
 * POST /api/v1/business/calculate-order
 * Calculate order totals including taxes, discounts, and shipping
 */
router.post('/calculate-order', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    quantity: z.number().int().min(1),
    unit_price: z.number().min(0),
    currency: z.string().length(3).default('USD'),
    customer_id: z.string().uuid(),
    species: z.string().min(1),
    country: z.string().length(2).optional(),
    estimated_weight_kg: z.number().min(0).optional(),
  });

  const data = schema.parse(req.body);
  
  const calculations = await businessLogicService.calculateOrderTotals(
    data.quantity,
    data.unit_price,
    data.currency,
    data.customer_id,
    data.species,
    data.country,
    data.estimated_weight_kg
  );

  res.json({
    success: true,
    data: {
      input: data,
      calculations,
    },
  });
}));

/**
 * POST /api/v1/business/validate-order
 * Validate business rules for an order
 */
router.post('/validate-order', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    customer_id: z.string().uuid(),
    species: z.string().min(1),
    quantity: z.number().int().min(1),
    total_value: z.number().min(0),
  });

  const data = schema.parse(req.body);
  
  const validation = await businessLogicService.validateOrderRules(
    data.customer_id,
    data.species,
    data.quantity,
    data.total_value
  );

  res.json({
    success: true,
    data: {
      input: data,
      validation,
    },
  });
}));

/**
 * POST /api/v1/business/recommended-pricing
 * Get recommended pricing for a species and quantity
 */
router.post('/recommended-pricing', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    species: z.string().min(1),
    quantity: z.number().int().min(1),
    customer_id: z.string().uuid().optional(),
  });

  const data = schema.parse(req.body);
  
  const pricing = await businessLogicService.getRecommendedPricing(
    data.species,
    data.quantity,
    data.customer_id
  );

  res.json({
    success: true,
    data: {
      input: data,
      pricing,
    },
  });
}));

/**
 * GET /api/v1/business/customer-tier/:customerId
 * Get customer tier based on purchase history
 */
router.get('/customer-tier/:customerId', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { customerId } = req.params;
  
  if (!z.string().uuid().safeParse(customerId).success) {
    throw new ApiError('Invalid customer ID format', 400);
  }

  const tier = await businessLogicService.getCustomerTier(customerId);

  res.json({
    success: true,
    data: {
      customer_id: customerId,
      tier,
      tier_benefits: {
        bronze: { discount: '0%', credit_limit: '$10,000' },
        silver: { discount: '3%', credit_limit: '$25,000' },
        gold: { discount: '5%', credit_limit: '$50,000' },
        platinum: { discount: '8%', credit_limit: '$100,000' },
      }[tier],
    },
  });
}));

/**
 * POST /api/v1/business/calculate-discount
 * Calculate applicable discounts for an order
 */
router.post('/calculate-discount', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    subtotal: z.number().min(0),
    quantity: z.number().int().min(1),
    species: z.string().min(1),
    customer_id: z.string().uuid(),
  });

  const data = schema.parse(req.body);
  
  const discountAmount = await businessLogicService.calculateDiscount(
    data.subtotal,
    data.quantity,
    data.species,
    data.customer_id
  );

  // Get applicable rules for transparency
  const customerTier = await businessLogicService.getCustomerTier(data.customer_id);
  const applicableRules = await businessLogicService.getApplicablePricingRules(
    data.species,
    data.quantity,
    customerTier
  );

  res.json({
    success: true,
    data: {
      input: data,
      discount_amount: discountAmount,
      discount_percentage: data.subtotal > 0 ? (discountAmount / data.subtotal) * 100 : 0,
      customer_tier: customerTier,
      applicable_rules: applicableRules,
    },
  });
}));

/**
 * POST /api/v1/business/calculate-shipping
 * Calculate shipping cost for an order
 */
router.post('/calculate-shipping', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    country: z.string().length(2),
    weight_kg: z.number().min(0),
    currency: z.string().length(3).default('USD'),
  });

  const data = schema.parse(req.body);
  
  const shippingCost = await businessLogicService.calculateShipping(
    data.country,
    data.weight_kg,
    data.currency
  );

  res.json({
    success: true,
    data: {
      input: data,
      shipping_cost: shippingCost,
      estimated_delivery_days: {
        'TH': '1-2 days',
        'PH': '3-5 days',
        'VN': '3-4 days',
        'ID': '4-6 days',
        'MY': '2-3 days',
        'SG': '2-3 days',
      }[data.country] || '5-10 days',
    },
  });
}));

/**
 * POST /api/v1/business/calculate-tax
 * Calculate tax for an order
 */
router.post('/calculate-tax', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    amount: z.number().min(0),
    country: z.string().length(2),
  });

  const data = schema.parse(req.body);
  
  const taxAmount = await businessLogicService.calculateTax(data.amount, data.country);
  const taxRate = await businessLogicService.getTaxRate(data.country);

  res.json({
    success: true,
    data: {
      input: data,
      tax_amount: taxAmount,
      tax_rate: taxRate,
    },
  });
}));

/**
 * GET /api/v1/business/shipping-rates
 * Get all available shipping rates
 */
router.get('/shipping-rates', 
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const countries = ['TH', 'PH', 'VN', 'ID', 'MY', 'SG'];
    const shippingRates = [];

    for (const country of countries) {
      const rate = await businessLogicService.getShippingRate(country);
      if (rate) {
        shippingRates.push(rate);
      }
    }

    res.json({
      success: true,
      data: {
        shipping_rates: shippingRates,
        coverage_countries: countries,
      },
    });
  })
);

/**
 * GET /api/v1/business/tax-rates
 * Get all available tax rates
 */
router.get('/tax-rates', 
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const countries = ['TH', 'PH', 'VN', 'ID', 'MY', 'SG'];
    const taxRates = [];

    for (const country of countries) {
      const rate = await businessLogicService.getTaxRate(country);
      if (rate) {
        taxRates.push(rate);
      }
    }

    res.json({
      success: true,
      data: {
        tax_rates: taxRates,
        coverage_countries: countries,
      },
    });
  })
);

/**
 * POST /api/v1/business/convert-currency
 * Convert amount between currencies
 */
router.post('/convert-currency', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    amount: z.number().min(0),
    from_currency: z.string().length(3),
    to_currency: z.string().length(3),
  });

  const data = schema.parse(req.body);
  
  const convertedAmount = await businessLogicService.convertCurrency(
    data.amount,
    data.from_currency,
    data.to_currency
  );

  res.json({
    success: true,
    data: {
      input: data,
      converted_amount: convertedAmount,
      exchange_rate: data.amount > 0 ? convertedAmount / data.amount : 0,
      note: 'Exchange rates are simplified for demo purposes',
    },
  });
}));

/**
 * GET /api/v1/business/rules/pricing
 * Get all active pricing rules
 */
router.get('/rules/pricing', 
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get sample pricing rules for different scenarios
    const sampleRules = await businessLogicService.getApplicablePricingRules(
      'Penaeus monodon', // Sample species
      100, // Sample quantity
      'gold' // Sample tier
    );

    res.json({
      success: true,
      data: {
        pricing_rules: sampleRules,
        rule_types: [
          'Volume discounts',
          'Customer tier discounts',
          'Species-specific discounts',
          'Seasonal promotions',
          'Loyalty rewards',
        ],
        note: 'This is a simplified rule engine for demonstration',
      },
    });
  })
);

export default router;