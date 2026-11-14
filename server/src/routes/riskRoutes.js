import { Router } from 'express';
import { getProjectRiskInsights } from '../controllers/riskController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';
import { ROLES } from '../constants/roles.js';

const router = Router();
router.use(authenticate, authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER));
router.get('/', getProjectRiskInsights);
export default router;
