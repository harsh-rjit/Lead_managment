import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/organization.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { updateSettingsSchema } from '../validations/organization.validation.js';

const router = Router();

router.use(authenticateToken);

// Admin-only endpoints (Managers and Sales cannot manage organization settings)
router.get('/settings', authorizeRoles('admin'), getSettings);
router.patch('/settings', authorizeRoles('admin'), validate(updateSettingsSchema), updateSettings);

export default router;
