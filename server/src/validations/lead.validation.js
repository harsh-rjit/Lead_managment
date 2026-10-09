import { z } from 'zod';

export const LEAD_STATUS_ENUM = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
export const LEAD_PRIORITY_ENUM = ['low', 'medium', 'high', 'urgent'];
export const LEAD_SOURCE_ENUM = ['manual', 'csv', 'website', 'referral', 'linkedin', 'other'];

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for route params requiring a valid MongoDB ObjectId (:id)
 */
export const leadIdParamSchema = {
  params: z.object({
    id: z.string().regex(MONGO_ID_REGEX, { message: 'Invalid lead ID format (must be 24-character hexadecimal ObjectId)' }),
  }),
};

/**
 * Validation schema for creating a new Lead (POST /api/leads)
 */
export const createLeadSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Lead name is required' })
      .trim()
      .min(2, { message: 'Lead name must be at least 2 characters long' })
      .max(100, { message: 'Lead name cannot exceed 100 characters' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Please provide a valid email address' })
      .optional()
      .or(z.literal('')),
    phone: z.string().trim().max(30).optional().default(''),
    company: z.string().trim().max(100).optional().default(''),
    requirement: z.string().trim().max(2000).optional().default(''),
    budget: z
      .number({ invalid_type_error: 'Budget must be a numeric value' })
      .min(0, { message: 'Budget cannot be negative' })
      .optional()
      .default(0),
    source: z
      .enum(LEAD_SOURCE_ENUM, {
        errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCE_ENUM.join(', ')}` }),
      })
      .optional()
      .default('manual'),
    status: z
      .enum(LEAD_STATUS_ENUM, {
        errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUS_ENUM.join(', ')}` }),
      })
      .optional()
      .default('new'),
    priority: z
      .enum(LEAD_PRIORITY_ENUM, {
        errorMap: () => ({ message: `Priority must be one of: ${LEAD_PRIORITY_ENUM.join(', ')}` }),
      })
      .optional()
      .default('medium'),
    assignedTo: z
      .string()
      .regex(MONGO_ID_REGEX, { message: 'assignedTo must be a valid User ObjectId' })
      .optional()
      .nullable(),
  }),
};

/**
 * Validation schema for updating a Lead (PUT /api/leads/:id)
 */
export const updateLeadSchema = {
  params: z.object({
    id: z.string().regex(MONGO_ID_REGEX, { message: 'Invalid lead ID format' }),
  }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    phone: z.string().trim().max(30).optional(),
    company: z.string().trim().max(100).optional(),
    requirement: z.string().trim().max(2000).optional(),
    budget: z.number().min(0).optional(),
    source: z.enum(LEAD_SOURCE_ENUM).optional(),
    status: z.enum(LEAD_STATUS_ENUM).optional(),
    priority: z.enum(LEAD_PRIORITY_ENUM).optional(),
    assignedTo: z.string().regex(MONGO_ID_REGEX).optional().nullable(),
  }),
};

/**
 * Validation schema for querying leads with pagination, search, and filters (GET /api/leads)
 */
export const queryLeadsSchema = {
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1))
      .refine((val) => val > 0, { message: 'Page must be a positive integer greater than 0' }),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10))
      .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' }),
    status: z.enum(LEAD_STATUS_ENUM).optional(),
    priority: z.enum(LEAD_PRIORITY_ENUM).optional(),
    source: z.enum(LEAD_SOURCE_ENUM).optional(),
    search: z.string().trim().optional(),
    assignedTo: z.string().regex(MONGO_ID_REGEX).optional(),
    sortBy: z.enum(['createdAt', 'name', 'company', 'budget', 'priority', 'status']).optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
};

/**
 * Validation schema for individual CSV rows during bulk import
 */
export const csvLeadRowSchema = z.object({
  name: z
    .string({ required_error: 'Lead name is required' })
    .trim()
    .min(2, { message: 'Lead name must be at least 2 characters long' })
    .max(100, { message: 'Lead name cannot exceed 100 characters' }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal(''))
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: 'Please provide a valid email address',
    }),
  phone: z
    .string()
    .trim()
    .max(30, { message: 'Phone number cannot exceed 30 characters' })
    .optional()
    .default(''),
  company: z
    .string()
    .trim()
    .max(100, { message: 'Company name cannot exceed 100 characters' })
    .optional()
    .default(''),
  requirement: z
    .string()
    .trim()
    .max(2000, { message: 'Requirement description cannot exceed 2000 characters' })
    .optional()
    .default(''),
  budget: z
    .preprocess((val) => {
      if (val === undefined || val === null || val === '') return 0;
      const cleanStr = String(val).replace(/[^0-9.-]+/g, '');
      const num = Number(cleanStr);
      return isNaN(num) ? 0 : num;
    }, z.number().min(0, { message: 'Budget cannot be negative' }))
    .default(0),
  status: z
    .preprocess((val) => {
      if (!val || typeof val !== 'string') return 'new';
      return val.trim().toLowerCase();
    }, z.enum(LEAD_STATUS_ENUM, {
      errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUS_ENUM.join(', ')}` }),
    }))
    .default('new'),
  priority: z
    .preprocess((val) => {
      if (!val || typeof val !== 'string') return 'medium';
      return val.trim().toLowerCase();
    }, z.enum(LEAD_PRIORITY_ENUM, {
      errorMap: () => ({ message: `Priority must be one of: ${LEAD_PRIORITY_ENUM.join(', ')}` }),
    }))
    .default('medium'),
});
