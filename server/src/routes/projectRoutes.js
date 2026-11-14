import { Router } from 'express';
import { createProject, deleteProject, getProject, listProjects, updateProject } from '../controllers/projectController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { auditMutations } from '../services/auditService.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../constants/roles.js';
import { projectSchemas } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, auditMutations);
router.get('/', listProjects);
router.get('/:id', validate(projectSchemas.id), getProject);
router.post('/', authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER), validate(projectSchemas.create), createProject);
router.patch('/:id', authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER), validate(projectSchemas.update), updateProject);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER), validate(projectSchemas.id), deleteProject);
export default router;