import { z } from 'zod';

export const LEAD_STATUS_ENUM = ['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'];
export const LEAD_PRIORITY_ENUM = ['low', 'medium', 'high', 'urgent'];
export const LEAD_SOURCE_ENUM = ['manual', 'csv', 'website', 'referral', 'linkedin', 'other'];

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Validation schema for creating a new Lead
 */
export const createLeadSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Lead name is required' })
      .trim()
      .min(2, { message: 'Lead name must be at least 2 characters' })
      .max(100, { message: 'Lead name cannot exceed 100 characters' }),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email({ message: 'Invalid email address' })
      .optional()
      .or(z.literal('')),
    phone: z.string().trim().max(30).optional().default(''),
    company: z.string().trim().max(100).optional().default(''),
    requirement: z.string().trim().max(2000).optional().default(''),
    budget: z
      .number({ invalid_type_error: 'Budget must be a number' })
      .min(0, { message: 'Budget cannot be negative' })
      .optional()
      .default(0),
    source: z.enum(LEAD_SOURCE_ENUM, {
      errorMap: () => ({ message: `Source must be one of: ${LEAD_SOURCE_ENUM.join(', ')}` }),
    }).optional().default('manual'),
    status: z.enum(LEAD_STATUS_ENUM, {
      errorMap: () => ({ message: `Status must be one of: ${LEAD_STATUS_ENUM.join(', ')}` }),
    }).optional().default('new'),
    priority: z.enum(LEAD_PRIORITY_ENUM, {
      errorMap: () => ({ message: `Priority must be one of: ${LEAD_PRIORITY_ENUM.join(', ')}` }),
    }).optional().default('medium'),
    assignedTo: z
      .string()
      .regex(MONGO_ID_REGEX, { message: 'assignedTo must be a valid User ObjectId' })
      .optional()
      .nullable(),
  }),
};

/**
 * Validation schema for updating an existing Lead
 */
export const updateLeadSchema = {
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
 * Validation schema for lead filtering & pagination query params
 */
export const queryLeadsSchema = {
  query: z.object({
    page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
    limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
    status: z.enum(LEAD_STATUS_ENUM).optional(),
    priority: z.enum(LEAD_PRIORITY_ENUM).optional(),
    source: z.enum(LEAD_SOURCE_ENUM).optional(),
    search: z.string().trim().optional(),
    assignedTo: z.string().regex(MONGO_ID_REGEX).optional(),
  }),
};
