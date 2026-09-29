import AppError from '../utils/AppError.js';

/**
 * Reusable Role-Based Access Control (RBAC) Authorization Middleware
 *
 * Checks if the authenticated user's role is included in the allowed roles list.
 * MUST be placed after authenticateToken middleware in the route chain.
 *
 * @param {...string} allowedRoles - List of authorized roles ('admin', 'manager', 'sales')
 * @returns {Function} Express middleware
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Verify user context was properly attached by authenticateToken
    if (!req.user || !req.user.role) {
      return next(
        new AppError('User authentication context is missing. Please authenticate first.', 401)
      );
    }

    // 2. Check if user's role satisfies the endpoint permissions
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access forbidden: Your role (${req.user.role}) is not authorized to access this resource. Required role: ${allowedRoles.join(' or ')}.`,
          403
        )
      );
    }

    // 3. Role verified; proceed to controller
    next();
  };
};

export default authorizeRoles;
