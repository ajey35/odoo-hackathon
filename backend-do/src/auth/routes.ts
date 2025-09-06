import { Router } from 'express';
import { AuthController } from './controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema, refreshTokenSchema, updateProfileSchema } from './schemas';

const router = Router();

// Public routes
router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.post('/refresh', validate(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.get('/profile', authenticate, AuthController.getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);

export default router;