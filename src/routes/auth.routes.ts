import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import { authLimiter } from '../middlewares/rateLimiter';
import {
    loginSchema,
    registerSchema,
    changePasswordSchema,
    refreshTokenSchema,
} from '../validations/auth.validation';

const router = Router();

// Public routes
router.post(
    '/login',
    // authLimiter,
    validateRequest(loginSchema),
    AuthController.login
);
router.post('/register', validateRequest(registerSchema), AuthController.register);
router.post('/refresh-token', validateRequest(refreshTokenSchema), AuthController.refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout', AuthController.logout);
router.get('/me', AuthController.getCurrentUser);
// to match front-end
// router.get('/session', AuthController.getCurrentUser);
router.put('/change-password', validateRequest(changePasswordSchema), AuthController.changePassword);

export default router;