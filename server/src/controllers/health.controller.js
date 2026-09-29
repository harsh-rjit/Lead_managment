import healthService from '../services/health.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Health check controller
 * Delegates business logic to HealthService and returns HTTP response.
 */
export const getHealth = asyncHandler(async (req, res) => {
  const healthData = await healthService.getSystemHealth();

  res.status(200).json(healthData);
});

export default {
  getHealth,
};
