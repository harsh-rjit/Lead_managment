/**
 * Standardized API response format for consistent client consumption.
 *
 * @param {Object} res - Express response object
 * @param {Object} options - Response configuration
 * @param {number} options.statusCode - HTTP status code (default: 200)
 * @param {boolean} options.success - Operation success status (default: true)
 * @param {string} options.message - Human-readable message
 * @param {*} options.data - Primary payload data
 * @param {Object} [options.meta] - Optional pagination or metadata
 */
export const sendResponse = (
  res,
  { statusCode = 200, success = true, message = '', data = null, meta = null }
) => {
  const responsePayload = {
    success,
    status: success ? 'ok' : 'error',
    message,
    ...(data !== null && { data }),
    ...(meta && { meta }),
  };

  return res.status(statusCode).json(responsePayload);
};

export default sendResponse;
