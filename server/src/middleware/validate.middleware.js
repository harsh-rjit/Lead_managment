import AppError from '../utils/AppError.js';

/**
 * Reusable Zod schema validation middleware.
 * Validates req.body, req.query, or req.params before the request reaches the controller.
 *
 * @param {Object} schema - Object containing Zod schemas for body, query, or params
 * @param {import('zod').ZodSchema} [schema.body]
 * @param {import('zod').ZodSchema} [schema.query]
 * @param {import('zod').ZodSchema} [schema.params]
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    if (schema.body) {
      req.body = await schema.body.parseAsync(req.body);
    }
    if (schema.query) {
      req.query = await schema.query.parseAsync(req.query);
    }
    if (schema.params) {
      req.params = await schema.params.parseAsync(req.params);
    }
    next();
  } catch (err) {
    if (err.errors) {
      // Format Zod issues into clear field-specific error messages
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      const errorMessage = formattedErrors
        .map((e) => `${e.field ? `${e.field}: ` : ''}${e.message}`)
        .join(', ');

      const appError = new AppError(`Validation failed: ${errorMessage}`, 400);
      appError.details = formattedErrors;
      return next(appError);
    }
    next(err);
  }
};

export default validate;
