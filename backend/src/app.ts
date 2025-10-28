import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import fileRoutes from './routes/files';
import customerRoutes from './routes/customers';
import orderRoutes from './routes/orders';
import broodstockBatchRoutes from './routes/broodstockBatches';
import geocodingRoutes from './routes/geocoding';
import businessRoutes from './routes/business';
import settingsRoutes from './routes/settings';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowAllOrigins = config.corsOrigins === '*';

app.use(cors({
  origin: allowAllOrigins
    ? '*'
    : (requestOrigin, callback) => {
        if (!requestOrigin) {
          return callback(null, false);
        }

        if (config.corsOrigins.includes(requestOrigin)) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${requestOrigin} not allowed by CORS configuration`));
      },
  credentials: !allowAllOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition'],
}));

// CORS preflight requests are handled by the main CORS middleware above

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    message: 'Shrimp Broodstock Sales API - Running!',
  });
});

// API routes
app.use('/api/v1', (req, res, next) => {
  // API version middleware - can add versioning logic here
  next();
});

// Static file serving for uploads (local storage only)
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/broodstock-batches', broodstockBatchRoutes);
app.use('/api/v1/geocoding', geocodingRoutes);
app.use('/api/v1/business', businessRoutes);
app.use('/api/v1/settings', settingsRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
