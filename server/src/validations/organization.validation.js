import { z } from 'zod';

export const updateSettingsSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    settings: z
      .object({
        leadAutoAssignment: z.boolean().optional(),
        defaultAiTone: z.enum(['professional', 'friendly', 'urgent', 'persuasive']).optional(),
        maxMonthlyAiQueries: z.number().int().positive().optional(),
      })
      .optional(),
  }),
};
