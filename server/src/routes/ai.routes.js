import { Router } from 'express';
import {
  analyzeLead,
  getLeadAnalysis,
  generateFollowUp,
} from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  analyzeLeadParamSchema,
  generateFollowUpSchema,
} from '../validations/ai.validation.js';

const router = Router();

// All AI routes require a valid JWT token
router.use(authenticateToken);

// POST /api/ai/analyze/:leadId - Trigger Gemini analysis for a lead
router.post(
  '/analyze/:leadId',
  validate(analyzeLeadParamSchema),
  analyzeLead
);

// GET /api/ai/lead/:leadId - Fetch latest AI analysis for a lead
router.get(
  '/lead/:leadId',
  validate(analyzeLeadParamSchema),
  getLeadAnalysis
);

// POST /api/ai/follow-up/:leadId - Generate AI follow-up message (email or short message)
router.post(
  '/follow-up/:leadId',
  validate(generateFollowUpSchema),
  generateFollowUp
);

export default router;
