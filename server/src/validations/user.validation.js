import { z } from 'zod';

export const inviteUserSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, { message: 'Name must be at least 2 characters' }),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email({ message: 'Valid email is required' }),
    password: z
      .string({ required_error: 'Temporary password is required' })
      .min(8, { message: 'Password must be at least 8 characters' }),
    role: z.enum(['admin', 'manager', 'sales'], {
      required_error: 'Role must be admin, manager, or sales',
    }),
  }),
};

export const updateUserRoleSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid user ID' }),
  }),
  body: z.object({
    role: z.enum(['admin', 'manager', 'sales'], {
      required_error: 'Role must be admin, manager, or sales',
    }),
  }),
};

export const updateUserStatusSchema = {
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, { message: 'Invalid user ID' }),
  }),
  body: z.object({
    status: z.enum(['active', 'inactive'], {
      required_error: 'Status must be active or inactive',
    }),
  }),
};
