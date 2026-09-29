import { Router } from 'express';
import { register } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema } from '../validations/auth.validation.js';

const router = Router();

// POST /api/v1/auth/register
router.post('/register', validate(registerSchema), register);

export default router;
