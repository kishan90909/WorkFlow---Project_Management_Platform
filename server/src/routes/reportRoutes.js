import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { getReports } from '../controllers/reportController.js';

const router = Router();
router.use(authenticate);
router.get('/overview', getReports);
export default router;
