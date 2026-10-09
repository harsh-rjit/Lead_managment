import { Router } from 'express';
import {
  createLead,
  getLeads,
  getTeamLeads,
  getMyLeads,
  getLeadAssignees,
  getLeadById,
  updateLead,
  deleteLead,
  importLeadsCSV,
  getLeadActivities,
} from '../controllers/lead.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { uploadCSV } from '../middleware/upload.middleware.js';
import {
  createLeadSchema,
  updateLeadSchema,
  queryLeadsSchema,
  leadIdParamSchema,
} from '../validations/lead.validation.js';

const router = Router();

// All lead endpoints require valid JWT authentication
router.use(authenticateToken);

// GET /api/leads/assignees - Get assignable team members (Must precede /:id)
router.get('/assignees', getLeadAssignees);

// POST /api/leads/import/csv - Bulk import leads from CSV file (Must precede /:id)
router.post('/import/csv', uploadCSV('file'), importLeadsCSV);

// POST /api/leads - Create new lead
router.post('/', validate(createLeadSchema), createLead);

// GET /api/leads - Query leads with pagination, search, and filters
router.get('/', validate(queryLeadsSchema), getLeads);

// GET /api/leads/team - Team leads pipeline (Admin & Manager only)
router.get('/team', authorizeRoles('admin', 'manager'), validate(queryLeadsSchema), getTeamLeads);

// GET /api/leads/my-leads - Leads assigned to requesting user (All authenticated roles)
router.get('/my-leads', authorizeRoles('admin', 'manager', 'sales'), validate(queryLeadsSchema), getMyLeads);

// GET /api/leads/:id/activities - Retrieve chronological lead activity timeline
router.get('/:id/activities', validate(leadIdParamSchema), getLeadActivities);

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
