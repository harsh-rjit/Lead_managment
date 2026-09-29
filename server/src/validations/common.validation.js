import { z } from 'zod';

// Valid 24-character hexadecimal MongoDB ObjectId regex
const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validates route parameters that require a valid MongoDB ObjectId (:id)
 */
export const mongoIdParamSchema = {
  params: z.object({
    id: z.string().regex(MONGO_ID_REGEX, { message: 'Invalid MongoDB ObjectId parameter' }),
  }),
};

/**
 * Standard pagination and sorting query parameter validation schema
 */
export const paginationQuerySchema = {
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be a positive integer' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 20))
      .refine((val) => val > 0 && val <= 100, {
        message: 'Limit must be between 1 and 100',
      }),
    search: z.string().trim().optional(),
    sortBy: z.string().trim().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};
