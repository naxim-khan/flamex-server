// routes/users.routes.ts
import { Router } from 'express';
import { UsersController } from '../controllers/users.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, requireManager } from '../middlewares/auth.middlewares';
import {
  createUserSchema,
  updateUserSchema,
  updateProfileSchema,
} from '../validations/users.validation';
import {debugRoute} from "../middlewares/debug.middleware"
const router = Router();

router.use(authenticate);
router.use(debugRoute);

// All users (admin/manager only)
router.get('/', requireManager, UsersController.getUsers);
router.post('/', requireManager, validateRequest(createUserSchema), UsersController.createUser);
router.get('/:id', requireManager, UsersController.getUser);
router.put('/:id', requireManager, validateRequest(updateUserSchema), UsersController.updateUser);
router.delete('/:id', requireManager, UsersController.deleteUser);

// Profile routes (accessible to own user)
router.get('/profile/me', UsersController.getCurrentUser);
router.put('/profile/update', validateRequest(updateProfileSchema), UsersController.updateProfile);
router.put('/profile/deactivate', UsersController.deactivateUser);

export default router;