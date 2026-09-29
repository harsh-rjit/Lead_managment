import { Router } from 'express';
import { analyzeLead, getLeadAnalysis } from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { analyzeLeadParamSchema } from '../validations/ai.validation.js';

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

export default router;
