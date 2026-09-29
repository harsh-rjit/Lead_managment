import mongoose from 'mongoose';
import { config } from '../config/env.js';

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * HealthService
 * Encapsulates system health inspection, database readiness checks,
 * and operational metrics.
 */
class HealthService {
  /**
   * Retrieves comprehensive system health status
   * @returns {Promise<Object>} Formatted health status object
   */
  async getSystemHealth() {
    const dbStateCode = mongoose.connection.readyState;
    const dbStatus = DB_STATES[dbStateCode] || 'unknown';
    const isDbConnected = dbStatus === 'connected';

    const memoryUsage = process.memoryUsage();

    return {
      status: isDbConnected ? 'ok' : 'degraded',
      message: isDbConnected
        ? 'AI Business Operations SaaS API is running smoothly'
        : 'API is running but database is disconnected or connecting',
      timestamp: new Date().toISOString(),
      uptime: `${process.uptime().toFixed(2)}s`,
      environment: config.nodeEnv,
      database: {
        status: dbStatus,
        name: mongoose.connection.name || null,
        host: mongoose.connection.host || null,
      },
      system: {
        nodeVersion: process.version,
        memoryRss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      },
    };
  }
}

export default new HealthService();
