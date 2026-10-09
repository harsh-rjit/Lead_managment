import { Router } from 'express';
import { getAnalyticsOverview } from '../controllers/analytics.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Enforce JWT authentication
router.use(authenticateToken);

// GET /api/v1/analytics/overview and GET /api/v1/analytics
router.get('/overview', getAnalyticsOverview);
router.get('/', getAnalyticsOverview);

export default router;
