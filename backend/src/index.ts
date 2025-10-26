import app from './app';
import { config } from './config/env';
import { testConnection, closeDatabase } from './config/database';

const startServer = async (): Promise<void> => {
  try {
    // Test database connection (skip for now until Railway is configured)
    try {
      await testConnection();
    } catch (error) {
      console.log('⚠️  Database connection skipped - configure Railway URL to enable');
    }
    
    // Start the server
    const server = app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📍 Environment: ${config.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`\n📡 ${signal} received. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('🛑 HTTP server closed');
        
        // Close database connections
        await closeDatabase();
        
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      });
    };

    // Handle termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  }
};

// Start the application
startServer();