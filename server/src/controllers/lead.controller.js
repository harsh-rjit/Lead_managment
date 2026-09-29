import leadService from '../services/lead.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Create a new lead
 * Route: POST /api/v1/leads
 */
export const createLead = asyncHandler(async (req, res) => {
  // organizationId comes strictly from authenticated user context (never from req.body)
  const lead = await leadService.createLead(
    req.user.organizationId,
    req.body,
    req.user.userId
  );

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Lead created successfully.',
    data: lead,
  });
});

/**
 * Controller: List leads with pagination, search, and status filters
 * Route: GET /api/v1/leads
 */
export const getLeads = asyncHandler(async (req, res) => {
  const result = await leadService.getLeads(req.user.organizationId, {
    page: parseInt(req.query.page, 10) || 1,
    limit: parseInt(req.query.limit, 10) || 20,
    status: req.query.status,
    priority: req.query.priority,
    source: req.query.source,
    assignedTo: req.query.assignedTo,
    search: req.query.search,
    userRole: req.user.role,
    userId: req.user.userId,
  });

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
 * Route: GET /api/v1/leads/:id
 */
export const getLeadById = asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.user.organizationId, req.params.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead details retrieved.',
    data: lead,
  });
});

/**
 * Controller: Update lead
 * Route: PATCH /api/v1/leads/:id
 */
export const updateLead = asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(
    req.user.organizationId,
    req.params.id,
    req.body,
    req.user.userId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead updated successfully.',
    data: lead,
  });
});

/**
 * Controller: Delete lead
 * Route: DELETE /api/v1/leads/:id
 */
export const deleteLead = asyncHandler(async (req, res) => {
  const result = await leadService.deleteLead(req.user.organizationId, req.params.id);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead deleted successfully.',
    data: result,
  });
});

/**
 * Controller: Get team leads (Manager and Admin)
 * Route: GET /api/v1/leads/team
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
 * Controller: Get assigned personal leads (Sales, Manager, and Admin)
 * Route: GET /api/v1/leads/my-leads
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
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getTeamLeads,
  getMyLeads,
};
