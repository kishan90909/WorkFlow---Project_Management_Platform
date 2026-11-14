import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { projectAnalytics } from '../controllers/planningController.js';
const router = Router();
router.use(authenticate);
router.get('/analytics', projectAnalytics);
export default router;
