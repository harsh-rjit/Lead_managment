import leadService from '../services/lead.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Create a new lead
 * Route: POST /api/leads
 */
export const createLead = asyncHandler(async (req, res) => {
  const lead = await leadService.createLead(
    req.user.organizationId,
    req.body,
    req.user
  );

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Lead created successfully.',
    data: lead,
  });
});

/**
 * Controller: List leads with pagination, search, and filtering
 * Route: GET /api/leads
 */
export const getLeads = asyncHandler(async (req, res) => {
  const result = await leadService.getLeads(
    req.user.organizationId,
    req.query,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Leads retrieved successfully.',
    data: result.leads,
    meta: result.pagination,
  });
});

/**
 * Controller: Get single lead by ID
 * Route: GET /api/leads/:id
 */
export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(
    req.user.organizationId,
    req.params.id,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead details retrieved.',
    data: lead,
  });
});

/**
 * Controller: Update lead (PUT /api/leads/:id)
 * Route: PUT /api/leads/:id
 */
export const updateLead = asyncHandler(async (req, res) => {
  const updatedLead = await leadService.updateLead(
    req.user.organizationId,
    req.params.id,
    req.body,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead updated successfully.',
    data: updatedLead,
  });
});

/**
 * Controller: Delete lead
 * Route: DELETE /api/leads/:id
 */
export const deleteLead = asyncHandler(async (req, res) => {
  const result = await leadService.deleteLead(
    req.user.organizationId,
    req.params.id,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead deleted successfully.',
    data: result,
  });
});

export default {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
};
