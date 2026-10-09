import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import organizationRoutes from './organization.routes.js';
import leadRoutes from './lead.routes.js';
import aiRoutes from './ai.routes.js';
import automationRoutes from './automation.routes.js';
import analyticsRoutes from './analytics.routes.js';

const router = Router();

// Mount individual domain routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/organization', organizationRoutes);
router.use('/leads', leadRoutes);
router.use('/ai', aiRoutes);
router.use('/automations', automationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
