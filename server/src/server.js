import app from './app.js';
import { config } from './config/env.js';
import { connectDB } from './config/db.js';
import mongoose from 'mongoose';

const PORT = config.port;

/**
 * Start the application:
 * 1. Establish MongoDB Atlas connection
 * 2. Start Express HTTP server
 * 3. Register graceful shutdown handlers
 */
const startServer = async () => {
  try {
    // Connect to database before starting the Express server
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`🚀 AI Business Operations Server is running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🩺 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`===============================================`);
    });

    // Graceful shutdown helper
    const handleShutdown = async (signal) => {
      console.log(`\n[Shutdown] ${signal} signal received. Closing services...`);
      server.close(async () => {
        console.log('[Shutdown] HTTP server closed.');
        try {
          await mongoose.connection.close(false);
          console.log('[Shutdown] MongoDB connection closed.');
          process.exit(0);
        } catch (err) {
          console.error('[Shutdown Error] Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Server startup aborted: Failed to establish database connection.');
    console.error('👉 Please verify your MONGO_URI in server/.env before restarting.');
    process.exit(1);
  }
};

startServer();
