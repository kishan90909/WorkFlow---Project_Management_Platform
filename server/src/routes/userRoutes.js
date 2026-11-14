import { Router } from 'express';
import { createUser, deleteUser, getUser, listAssignableUsers, listUsers, updateUser } from '../controllers/userController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { auditMutations } from '../services/auditService.js';
import { authorize } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import { ROLES } from '../constants/roles.js';
import { userSchemas } from '../validators/schemas.js';

const router = Router();
router.use(authenticate, auditMutations);
router.get('/directory', authorize(ROLES.ADMIN, ROLES.PROJECT_MANAGER), listAssignableUsers);
router.use(authorize(ROLES.ADMIN));
router.get('/', listUsers);
router.post('/', validate(userSchemas.create), createUser);
router.get('/:id', validate(userSchemas.id), getUser);
router.patch('/:id', validate(userSchemas.update), updateUser);
router.delete('/:id', validate(userSchemas.id), deleteUser);
export default router;