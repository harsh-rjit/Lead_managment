import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Authentication Middleware
 * 1. Extracts Bearer token from Authorization header
 * 2. Verifies cryptographic signature against JWT_SECRET
 * 3. Checks token expiration
 * 4. Ensures the user account exists and remains active in MongoDB
 * 5. Attaches sanitized user identity context to req.user
 */
export const authenticateToken = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Access denied. Authentication token missing or improperly formatted.', 401)
    );
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Your session has expired. Please sign in again.', 401));
    }
    return next(new AppError('Invalid authentication token. Verification failed.', 401));
  }

  // Verify that the user still exists in the database
  const currentUser = await User.findById(decoded.userId).select('status role organizationId');
  if (!currentUser) {
    return next(new AppError('The user account linked to this token no longer exists.', 401));
  }

  if (currentUser.status !== 'active') {
    return next(new AppError('This user account is currently suspended or inactive.', 403));
  }

  // Attach verified user identity context to the request object
  req.user = {
    userId: currentUser._id.toString(),
    organizationId: currentUser.organizationId.toString(),
    role: currentUser.role,
  };

  next();
});

export default authenticateToken;
