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
      const parsedQuery = await schema.query.parseAsync(req.query);
      Object.defineProperty(req, 'query', {
        value: parsedQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    if (schema.params) {
      const parsedParams = await schema.params.parseAsync(req.params);
      Object.defineProperty(req, 'params', {
        value: parsedParams,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
    next();
  } catch (err) {
    const issues = err.issues || err.errors;
    if (issues && Array.isArray(issues)) {
      // Format Zod issues into clear field-specific error messages
      const formattedErrors = issues.map((e) => ({
        field: Array.isArray(e.path) ? e.path.join('.') : e.path,
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
