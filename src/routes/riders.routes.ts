// routes/riders.routes.ts
import { Router } from 'express';
import { RidersController } from '../controllers/riders.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import {
  createRiderSchema,
  updateRiderSchema,
} from '../validations/riders.validation';

const router = Router();

router.use(authenticate);

router.get('/', RidersController.getRiders);
router.post('/', validateRequest(createRiderSchema), RidersController.createRider);
router.get('/:id', RidersController.getRider);
router.put('/:id', validateRequest(updateRiderSchema), RidersController.updateRider);
router.delete('/:id', RidersController.deleteRider);
router.patch('/:id/toggle-status', RidersController.toggleRiderStatus);
router.get('/:id/orders', RidersController.getRiderOrders);
router.get('/available/active', RidersController.getActiveRiders);
router.get('/search/phone/:phone', RidersController.getRiderByPhone);

export default router;