import { z } from 'zod';

/**
 * Validation schema for User Registration
 * Validates name, email, password strength, and organization name
 */
export const registerSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Full name is required' })
      .trim()
      .min(2, { message: 'Name must be at least 2 characters long' })
      .max(60, { message: 'Name cannot exceed 60 characters' }),

    email: z
      .string({ required_error: 'Work email is required' })
      .trim()
      .toLowerCase()
      .email({ message: 'Please enter a valid email address' }),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(100, { message: 'Password cannot exceed 100 characters' })
      .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter' })
      .regex(/[0-9]/, { message: 'Password must contain at least one number' }),

    organizationName: z
      .string({ required_error: 'Organization name is required' })
      .trim()
      .min(2, { message: 'Organization name must be at least 2 characters long' })
      .max(100, { message: 'Organization name cannot exceed 100 characters' }),
  }),
};
