import { Router } from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { auditMutations } from '../services/auditService.js';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../controllers/notificationController.js';

const router = Router();
router.use(authenticate, auditMutations);
router.get('/', listNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);
export default router;
