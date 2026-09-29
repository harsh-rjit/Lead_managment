import { Router } from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  deleteLead,
} from '../controllers/lead.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  queryLeadsSchema,
  leadIdParamSchema,
} from '../validations/lead.validation.js';

const router = Router();

// All lead endpoints require valid JWT authentication
router.use(authenticateToken);

// POST /api/leads - Create new lead
router.post('/', validate(createLeadSchema), createLead);

// GET /api/leads - Query leads with pagination, search, and filters
router.get('/', validate(queryLeadsSchema), getLeads);

// GET /api/leads/:id - Retrieve single lead details
router.get('/:id', validate(leadIdParamSchema), getLeadById);

// PUT /api/leads/:id - Full/Partial update of lead
router.put('/:id', validate(updateLeadSchema), updateLead);

// PATCH /api/leads/:id - Convenience alias for PUT
router.patch('/:id', validate(updateLeadSchema), updateLead);

// DELETE /api/leads/:id - Delete lead (Admin & Manager only)
router.delete(
  '/:id',
  authorizeRoles('admin', 'manager'),
  validate(leadIdParamSchema),
  deleteLead
);

export default router;
