import { createApp } from './app.js';
import { config } from './config/index.js';
import { connectDatabase, disconnectDatabase } from './db/connection.js';
import { schedulerService } from './services/scheduler.service.js';

async function main(): Promise<void> {
  console.log('🚀 Starting CHANGE Platform API...');
  console.log(`   Environment: ${config.env}`);
  console.log(`   Port: ${config.port}`);

  try {
    // Connect to database
    await connectDatabase();

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(config.port, () => {
      console.log(`✅ Server running at http://localhost:${config.port}`);
      console.log(`   API Base: http://localhost:${config.port}/api/v1`);
      console.log(`   Health: http://localhost:${config.port}/api/v1/health`);
      
      // Start notification scheduler (checks every hour)
      if (config.smtp.host && config.smtp.user) {
        schedulerService.start(1); // Run every 1 hour
        console.log('📧 Email notification scheduler started');
      } else {
        console.log('📧 Email notifications disabled (SMTP not configured)');
      }
    });

    // Graceful shutdown
    const shutdown = async (signal: string): Promise<void> => {
      console.log(`\n📡 Received ${signal}. Shutting down gracefully...`);
      
      // Stop the scheduler
      schedulerService.stop();
      console.log('   Notification scheduler stopped');

      server.close(async () => {
        console.log('   HTTP server closed');

        await disconnectDatabase();
        console.log('   Database disconnected');

        console.log('👋 Goodbye!');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        console.error('   Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

main();
