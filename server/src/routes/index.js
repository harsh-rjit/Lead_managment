import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

// Mount individual domain routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

export default router;
