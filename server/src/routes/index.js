import { Router } from 'express';
import healthRoutes from './health.routes.js';

const router = Router();

// Mount individual domain routers
router.use('/health', healthRoutes);

export default router;
