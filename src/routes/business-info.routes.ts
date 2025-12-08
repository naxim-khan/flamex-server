// routes/business-info.routes.ts
import { Router } from 'express';
import { BusinessInfoController } from '../controllers/business-info.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, requireManager } from '../middlewares/auth.middlewares';
import {
  createBusinessInfoSchema,
  updateBusinessInfoSchema,
} from '../validations/business-info.validation';

const router = Router();

router.use(authenticate);

// Public read access
router.get('/', BusinessInfoController.getAllBusinessInfo);
router.get('/:key', BusinessInfoController.getBusinessInfoByKey);

// Protected write access (manager+)
router.use(requireManager);
router.post('/', validateRequest(createBusinessInfoSchema), BusinessInfoController.createBusinessInfo);
router.put('/:key', validateRequest(updateBusinessInfoSchema), BusinessInfoController.updateBusinessInfo);
router.delete('/:key', BusinessInfoController.deleteBusinessInfo);
router.get('/settings/all', BusinessInfoController.getAllSettings);

export default router;