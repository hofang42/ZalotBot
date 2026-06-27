import { Router } from 'express';
import webhookRoutes from './webhook.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();

router.use('/webhook', webhookRoutes);
router.use('/health', healthRoutes);

export default router;
