import { z } from 'zod';

export const createLeadSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Lead name is required' })
      .trim()
      .min(2, { message: 'Lead name must be at least 2 characters' }),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    phone: z.string().trim().optional().default(''),
    company: z.string().trim().optional().default(''),
    source: z.enum(['manual', 'csv', 'website', 'referral', 'other']).optional().default('manual'),
    status: z.enum(['new', 'contacted', 'qualified', 'lost', 'won']).optional().default('new'),
  }),
};

export const updateLeadSchema = {
  body: z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().trim().toLowerCase().email().optional().or(z.literal('')),
    phone: z.string().trim().optional(),
    company: z.string().trim().optional(),
    source: z.enum(['manual', 'csv', 'website', 'referral', 'other']).optional(),
    status: z.enum(['new', 'contacted', 'qualified', 'lost', 'won']).optional(),
    assignedTo: z.string().optional().nullable(),
  }),
};
