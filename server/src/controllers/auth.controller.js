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

/**
 * Controller: Authenticate user credentials and return JWT
 * Route: POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Login successful! Welcome back.',
    data: result,
  });
});

/**
 * Controller: Get current authenticated user profile
 * Route: GET /api/v1/auth/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const result = await authService.getCurrentUser(req.user.userId);

  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile retrieved successfully.',
    data: result,
  });
});

/**
 * Controller: Test protected route verifying token attachment
 * Route: GET /api/v1/auth/protected-test
 */
export const testProtected = asyncHandler(async (req, res) => {
  return sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Security verification passed! You have accessed a protected endpoint.',
    data: {
      authClaims: req.user,
      serverTime: new Date().toISOString(),
    },
  });
});

export default {
  register,
  login,
  getMe,
  testProtected,
};
