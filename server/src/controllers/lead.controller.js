import leadService from '../services/lead.service.js';
import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import AppError from '../utils/AppError.js';

/**
 * Controller: Get assignable team members in organization
 * Route: GET /api/leads/assignees
 */
export const getLeadAssignees = asyncHandler(async (req, res) => {
  const users = await User.find({
    organizationId: req.user.organizationId,
    status: 'active',
  })
    .select('name email role status')
    .sort({ name: 1 });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Assignable team members retrieved.',
    data: users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
    })),
  });
});

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
    pagination: result.pagination,
  });
});

/**
 * Controller: Get team leads (Admin & Manager only)
 * Route: GET /api/leads/team
 */
export const getTeamLeads = asyncHandler(async (req, res) => {
  const result = await leadService.getLeads(
    req.user.organizationId,
    req.query,
    { role: 'admin', userId: req.user.userId }
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Team leads retrieved successfully.',
    data: result.leads,
    meta: result.pagination,
    pagination: result.pagination,
  });
});

/**
 * Controller: Get assigned leads for current user
 * Route: GET /api/leads/my-leads
 */
export const getMyLeads = asyncHandler(async (req, res) => {
  const result = await leadService.getLeads(
    req.user.organizationId,
    { ...req.query, assignedTo: req.user.userId },
    { role: 'sales', userId: req.user.userId }
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'My assigned leads retrieved successfully.',
    data: result.leads,
    meta: result.pagination,
    pagination: result.pagination,
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

/**
 * Controller: Bulk import leads from uploaded CSV file
 * Route: POST /api/leads/import/csv
 */
export const importLeadsCSV = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please select a CSV file to upload.', 400);
  }

  const summary = await leadService.importLeadsFromCSV({
    fileBuffer: req.file.buffer,
    userContext: req.user,
  });

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `CSV import finished. ${summary.importedCount} leads imported, ${summary.failedCount} failed.`,
    data: summary,
  });
});

/**
 * Controller: Get chronological activity history for a specific lead
 * Route: GET /api/leads/:id/activities
 */
export const getLeadActivities = asyncHandler(async (req, res) => {
  const activities = await leadService.getLeadActivities(
    req.user.organizationId,
    req.params.id,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Lead activity history retrieved.',
    data: activities,
  });
});

export default {
  createLead,
  getLeads,
  getTeamLeads,
  getMyLeads,
  getLeadById,
  updateLead,
  deleteLead,
  importLeadsCSV,
  getLeadActivities,
};
