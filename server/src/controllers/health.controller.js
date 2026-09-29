/**
 * Health check controller
 * Confirms API availability, timestamp, and process uptime.
 */
export const getHealth = (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'AI Business Operations SaaS API is running smoothly',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(2)}s`,
    environment: process.env.NODE_ENV || 'development',
  });
};
