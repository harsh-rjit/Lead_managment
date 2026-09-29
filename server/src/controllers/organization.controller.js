import organizationService from '../services/organization.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Get organization settings
 * Route: GET /api/v1/organization/settings (Admin only)
 */
export const getSettings = asyncHandler(async (req, res) => {
  const org = await organizationService.getOrganization(req.user.organizationId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization settings retrieved.',
    data: org,
  });
});

/**
 * Controller: Update organization settings
 * Route: PATCH /api/v1/organization/settings (Admin only)
 */
export const updateSettings = asyncHandler(async (req, res) => {
  const updatedOrg = await organizationService.updateOrganization(
    req.user.organizationId,
    req.body
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization settings updated successfully.',
    data: updatedOrg,
  });
});

export default {
  getSettings,
  updateSettings,
};
