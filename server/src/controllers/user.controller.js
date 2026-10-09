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

export const createUser = inviteUser;

/**
 * Controller: Change user role
 * Route: PATCH /api/v1/users/:id/role (Admin only)
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserRole(
    req.params.id,
    req.body.role,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User ${updatedUser.name}'s role updated to '${updatedUser.role}'.`,
    data: updatedUser,
  });
});

/**
 * Controller: Activate or deactivate user
 * Route: PATCH /api/v1/users/:id/status (Admin only)
 */
export const updateUserStatus = asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserStatus(
    req.params.id,
    req.body.status,
    req.user
  );

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `User ${updatedUser.name} is now ${updatedUser.status}.`,
    data: updatedUser,
  });
});

export default {
  getUsers,
  inviteUser,
  createUser,
  updateUserRole,
  updateUserStatus,
};
