import { Router } from 'express';
import { createTeam, deleteTeam, listTeams, updateTeam } from '../controllers/teamController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { auditMutations } from '../services/auditService.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../constants/roles.js';
import { teamSchemas } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, auditMutations, authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER));
router.get('/', listTeams);
router.post('/', validate(teamSchemas.create), createTeam);
router.patch('/:id', validate(teamSchemas.update), updateTeam);
router.delete('/:id', validate(teamSchemas.id), deleteTeam);
export default router;