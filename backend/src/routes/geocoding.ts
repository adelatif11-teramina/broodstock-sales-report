import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, authorize, AuthenticatedRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { geocodingService } from '../services/geocodingService';

const router = Router();

// All geocoding routes require authentication
router.use(authenticate);

/**
 * POST /api/v1/geocoding/geocode
 * Geocode an address to coordinates
 */
router.post('/geocode', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    address: z.string().min(1).max(500),
    limit: z.number().min(1).max(10).default(5),
  });

  const { address, limit } = schema.parse(req.body);
  
  const results = await geocodingService.geocode(address);
  const limitedResults = results.slice(0, limit);

  res.json({
    success: true,
    data: {
      query: address,
      results: limitedResults,
      count: limitedResults.length,
    },
  });
}));

/**
 * POST /api/v1/geocoding/reverse
 * Reverse geocode coordinates to address
 */
router.post('/reverse', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  });

  const { latitude, longitude } = schema.parse(req.body);
  
  if (!geocodingService.isValidCoordinates(latitude, longitude)) {
    throw new ApiError('Invalid coordinates', 400);
  }

  const result = await geocodingService.reverseGeocode(latitude, longitude);

  if (!result) {
    throw new ApiError('No address found for these coordinates', 404);
  }

  res.json({
    success: true,
    data: {
      coordinates: { latitude, longitude },
      result,
    },
  });
}));

/**
 * POST /api/v1/geocoding/suggest
 * Get address suggestions with quality scores
 */
router.post('/suggest', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    address: z.string().min(1).max(500),
    threshold: z.number().min(0).max(1).default(0.7),
  });

  const { address, threshold } = schema.parse(req.body);
  
  const suggestions = await geocodingService.suggestAddressCorrections(address, threshold);

  res.json({
    success: true,
    data: {
      query: address,
      suggestions,
      count: suggestions.length,
      threshold,
    },
  });
}));

/**
 * POST /api/v1/geocoding/batch
 * Batch geocode multiple addresses
 */
router.post('/batch',
  authorize(['editor', 'manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const schema = z.object({
      addresses: z.array(z.string().min(1).max(500)).min(1).max(50),
      batch_size: z.number().min(1).max(10).default(5),
    });

    const { addresses, batch_size } = schema.parse(req.body);
    
    const results = await geocodingService.batchGeocode(addresses, batch_size);
    
    // Convert Map to object for JSON response
    const resultsObject: { [key: string]: any } = {};
    results.forEach((value, key) => {
      resultsObject[key] = value;
    });

    res.json({
      success: true,
      data: {
        results: resultsObject,
        processed_count: addresses.length,
        batch_size,
      },
    });
  })
);

/**
 * POST /api/v1/geocoding/distance
 * Calculate distance between two points
 */
router.post('/distance', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    from: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    to: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
  });

  const { from, to } = schema.parse(req.body);
  
  const distance = geocodingService.calculateDistance(
    from.latitude, 
    from.longitude, 
    to.latitude, 
    to.longitude
  );

  res.json({
    success: true,
    data: {
      from,
      to,
      distance_km: Math.round(distance * 100) / 100, // Round to 2 decimal places
      distance_miles: Math.round(distance * 0.621371 * 100) / 100,
    },
  });
}));

/**
 * GET /api/v1/geocoding/validate
 * Validate coordinates
 */
router.get('/validate', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    latitude: z.coerce.number(),
    longitude: z.coerce.number(),
  });

  const { latitude, longitude } = schema.parse(req.query);
  
  const isValid = geocodingService.isValidCoordinates(latitude, longitude);

  res.json({
    success: true,
    data: {
      coordinates: { latitude, longitude },
      is_valid: isValid,
      validation_rules: {
        latitude_range: '[-90, 90]',
        longitude_range: '[-180, 180]',
      },
    },
  });
}));

/**
 * GET /api/v1/geocoding/status
 * Get geocoding service status and configuration
 */
router.get('/status', 
  authorize(['manager', 'admin']),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Test geocoding service with a simple query
    let serviceStatus = 'unknown';
    let testResult = null;

    try {
      const testResults = await geocodingService.geocode('Bangkok, Thailand');
      serviceStatus = testResults.length > 0 ? 'operational' : 'degraded';
      testResult = {
        query: 'Bangkok, Thailand',
        results_count: testResults.length,
        first_result: testResults[0] || null,
      };
    } catch (error) {
      serviceStatus = 'error';
      testResult = {
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    res.json({
      success: true,
      data: {
        service_status: serviceStatus,
        provider: 'OpenStreetMap Nominatim',
        rate_limit: '1 request per second',
        coverage: 'Global (optimized for Southeast Asia)',
        test_result: testResult,
        features: {
          geocoding: true,
          reverse_geocoding: true,
          batch_processing: true,
          distance_calculation: true,
          address_suggestions: true,
        },
      },
    });
  })
);

export default router;