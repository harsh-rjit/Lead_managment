import { z } from 'zod';

const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Route parameter validation schema for /api/ai/analyze/:leadId
 */
export const analyzeLeadParamSchema = {
  params: z.object({
    leadId: z.string().regex(MONGO_ID_REGEX, {
      message: 'Invalid lead ID format (must be 24-character hexadecimal ObjectId)',
    }),
  }),
};

/**
 * Zod validation schema for Gemini's structured JSON output
 * Ensures the model strictly returns the required shape before persisting to MongoDB
 */
export const geminiAnalysisOutputSchema = z.object({
  score: z
    .number({ invalid_type_error: 'Score must be a number' })
    .min(0, { message: 'Score must be at least 0' })
    .max(100, { message: 'Score cannot exceed 100' }),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Priority must be one of: LOW, MEDIUM, HIGH' }),
  }),
  summary: z
    .string({ required_error: 'Summary is required' })
    .trim()
    .min(3, { message: 'Summary must be at least 3 characters' }),
  reasons: z
    .array(z.string().trim(), {
      required_error: 'Reasons array is required',
    })
    .min(1, { message: 'At least one reason must be provided' }),
  recommendedNextAction: z
    .string({ required_error: 'Recommended next action is required' })
    .trim()
    .min(3, { message: 'Recommended next action must be at least 3 characters' }),
});
