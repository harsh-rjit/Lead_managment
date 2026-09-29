import mongoose from 'mongoose';

const DB_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

/**
 * Health check controller
 * Confirms API availability, database connection state, and uptime.
 */
export const getHealth = (req, res) => {
  const dbStateCode = mongoose.connection.readyState;
  const dbStatus = DB_STATES[dbStateCode] || 'unknown';

  res.status(200).json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    message: 'AI Business Operations SaaS API is running',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || null,
      host: mongoose.connection.host || null,
    },
  });
};
