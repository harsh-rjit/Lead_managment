import { Router } from 'express';
import { getTeamLeads, getMyLeads } from '../controllers/lead.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticateToken);

// Manager & Admin can view and manage team leads
router.get('/team', authorizeRoles('admin', 'manager'), getTeamLeads);

// Sales users can view their assigned leads (Manager & Admin can also access this)
router.get('/my-leads', authorizeRoles('admin', 'manager', 'sales'), getMyLeads);

export default router;
