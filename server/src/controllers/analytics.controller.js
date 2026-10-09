import analyticsService from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Get analytics overview for authenticated user's organization
 * Route: GET /api/v1/analytics/overview (and GET /api/analytics/overview)
 */
export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.getOverview(req.user.organizationId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Analytics overview retrieved successfully.',
    data,
  });
});
