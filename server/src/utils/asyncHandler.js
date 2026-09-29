/**
 * Higher-order function that wraps asynchronous Express route handlers.
 * Catches rejected promises and passes them to Express next(err) middleware,
 * completely eliminating repetitive try-catch blocks in controllers.
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default asyncHandler;
