import { Router } from 'express';
import { getWorkloadOverview } from '../controllers/workloadController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER));
router.get('/', getWorkloadOverview);
export default router;
