import leadService from '../services/lead.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Get team leads
 * Route: GET /api/v1/leads/team (Admin and Manager only)
 */
export const getTeamLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.getTeamLeads(req.user.organizationId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team leads retrieved.',
    data: leads,
  });
});

/**
 * Controller: Get assigned leads
 * Route: GET /api/v1/leads/my-leads (Sales, Manager, and Admin)
 */
export const getMyLeads = asyncHandler(async (req, res) => {
  const leads = await leadService.getMyLeads(req.user.organizationId, req.user.userId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Your assigned leads retrieved.',
    data: leads,
  });
});

export default {
  getTeamLeads,
  getMyLeads,
};
