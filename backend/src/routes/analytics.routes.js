import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
router.use(authenticate);
router.get('/dashboard', getDashboardStats);
export default router;
