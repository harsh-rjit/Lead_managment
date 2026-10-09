import { Router } from 'express';
import {
  getUsers,
  inviteUser,
  createUser,
  updateUserRole,
  updateUserStatus,
} from '../controllers/user.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import {
  inviteUserSchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from '../validations/user.validation.js';

const router = Router();

// All user management routes require valid authentication and Admin role
router.use(authenticateToken);
router.use(authorizeRoles('admin'));

// GET /api/v1/users - List organization users
router.get('/', getUsers);

// POST /api/v1/users & POST /api/v1/users/invite - Add user
router.post('/', validate(inviteUserSchema), createUser);
router.post('/invite', validate(inviteUserSchema), inviteUser);

// PATCH /api/v1/users/:id/role - Change user role
router.patch('/:id/role', validate(updateUserRoleSchema), updateUserRole);

// PATCH /api/v1/users/:id/status - Activate or deactivate user
router.patch('/:id/status', validate(updateUserStatusSchema), updateUserStatus);

export default router;
