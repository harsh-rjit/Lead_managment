import { Router } from 'express';
import {
  getAutomations,
  toggleAutomation,
  runStaleLeadCheck,
} from '../controllers/automation.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// All automation endpoints require authentication
router.use(authenticateToken);

// GET /api/v1/automations - List all tenant automation rules
router.get('/', getAutomations);

// PATCH /api/v1/automations/:id/toggle - Toggle rule active state
router.patch('/:id/toggle', toggleAutomation);

// POST /api/v1/automations/evaluate-stale - Run on-demand stale lead check (Rule 2)
router.post('/evaluate-stale', runStaleLeadCheck);

export default router;
