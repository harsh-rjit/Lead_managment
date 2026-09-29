import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
  getTeamLeads,
  getMyLeads,
} from '../controllers/lead.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createLeadSchema, updateLeadSchema } from '../validations/lead.validation.js';

const router = Router();

// All lead routes require authentication
router.use(authenticateToken);

// Role-specific overviews
router.get('/team', authorizeRoles('admin', 'manager'), getTeamLeads);
router.get('/my-leads', authorizeRoles('admin', 'manager', 'sales'), getMyLeads);

// General Lead CRUD with multi-tenant isolation
router.get('/', getLeads);
router.post('/', validate(createLeadSchema), createLead);
router.get('/:id', getLeadById);
router.patch('/:id', validate(updateLeadSchema), updateLead);
router.delete('/:id', authorizeRoles('admin', 'manager'), deleteLead);

export default router;
