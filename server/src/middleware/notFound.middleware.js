import AppError from '../utils/AppError.js';

/**
 * 404 Route Not Found middleware.
 * Catches any request that didn't match an existing route and passes an AppError to next().
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl} - Route not found on this server`, 404));
};

export default notFoundHandler;
