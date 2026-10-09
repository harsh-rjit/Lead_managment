import automationService from '../services/automation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Get all automation rules for tenant (auto-seeds defaults if empty)
 * Route: GET /api/v1/automations
 */
export const getAutomations = asyncHandler(async (req, res) => {
  await automationService.seedDefaultRules(req.user.organizationId, req.user.userId);
  const rules = await automationService.getAutomations(req.user.organizationId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Automation rules retrieved successfully.',
    data: rules,
  });
});

/**
 * Controller: Toggle active status of an automation rule
 * Route: PATCH /api/v1/automations/:id/toggle
 */
export const toggleAutomation = asyncHandler(async (req, res) => {
  const updatedRule = await automationService.toggleAutomation(
    req.params.id,
    req.user.organizationId
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Automation rule "${updatedRule.name}" is now ${updatedRule.isActive ? 'active' : 'inactive'}.`,
    data: updatedRule,
  });
});

/**
 * Controller: Manually evaluate inactive new leads (Rule 2)
 * Route: POST /api/v1/automations/evaluate-stale
 */
export const runStaleLeadCheck = asyncHandler(async (req, res) => {
  const result = await automationService.evaluateInactiveLeads(
    req.user.organizationId,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Evaluated stale leads. Triggered ${result.triggeredCount} follow-up task(s).`,
    data: result,
  });
});
