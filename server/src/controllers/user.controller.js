import userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Get all users in the organization
 * Route: GET /api/v1/users (Admin only)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.getOrganizationUsers(req.user.organizationId);
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Organization team members retrieved.',
    data: users,
  });
});

/**
 * Controller: Invite new user to organization
 * Route: POST /api/v1/users/invite (Admin only)
 */
export const inviteUser = asyncHandler(async (req, res) => {
  const newUser = await userService.inviteUser({
    organizationId: req.user.organizationId,
    ...req.body,
  });

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: `User ${newUser.name} successfully created with role '${newUser.role}'.`,
    data: newUser,
  });
});

export default {
  getUsers,
  inviteUser,
};
