import { Router } from 'express';
import { register, login, getMe, testProtected } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { registerSchema, loginSchema } from '../validations/auth.validation.js';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

// Protected routes (Require valid Authorization: Bearer <token>)
router.get('/me', authenticateToken, getMe);
router.get('/protected-test', authenticateToken, testProtected);

export default router;
