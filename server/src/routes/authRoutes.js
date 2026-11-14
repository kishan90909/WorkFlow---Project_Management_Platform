import { Router } from 'express';
import { login, logout, me, register } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { authSchemas } from '../validators/schemas.js';

const router = Router();
router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, me);
export default router;