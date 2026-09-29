import authService from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';

/**
 * Controller: Register a new user and organization
 * Route: POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Registration successful! Your organization and admin account have been created.',
    data: result,
  });
});

export default {
  register,
};
