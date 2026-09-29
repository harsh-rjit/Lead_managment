import { Router } from 'express';
import { getUsers, inviteUser } from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { inviteUserSchema } from '../validations/user.validation.js';

const router = Router();

// All user management routes require valid authentication
router.use(authenticateToken);

// Admin-only endpoints
router.get('/', authorizeRoles('admin'), getUsers);
router.post('/invite', authorizeRoles('admin'), validate(inviteUserSchema), inviteUser);

export default router;
