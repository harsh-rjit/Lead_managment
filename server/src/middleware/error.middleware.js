import { config } from '../config/env.js';
import AppError from '../utils/AppError.js';

/**
 * Handle Mongoose CastError (e.g. invalid ObjectId format)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key Error (Code 11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' entered for ${field}. Please use another value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Validation Error (Schema rule violations)
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Send detailed error in development mode
 */
const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

/**
 * Send clean, sanitized error in production mode
 */
const sendErrorProd = (err, req, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
    });
  }

  // Programming or unknown error: don't leak details to clients
  console.error('💥 UNEXPECTED SYSTEM ERROR:', err);
  return res.status(500).json({
    success: false,
    status: 'error',
    message: 'An unexpected internal error occurred. Please try again later.',
  });
};

/**
 * Centralized Express Error Handling Middleware.
 * MUST accept 4 arguments (err, req, res, next) for Express to recognize it as an error handler.
 */
export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Transform specific database / library errors into clean AppErrors
  if (error.name === 'CastError') error = handleCastErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);
  if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
  if (error.name === 'JsonWebTokenError') error = new AppError('Invalid authentication token.', 401);
  if (error.name === 'TokenExpiredError') error = new AppError('Your token has expired. Please log in again.', 401);

  if (config.nodeEnv === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

export default errorHandler;
