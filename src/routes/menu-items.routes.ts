// routes/menu-items.routes.ts
import { Router } from 'express';
import { MenuItemsController } from '../controllers/menu-items.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import {
  createMenuItemSchema,
  updateMenuItemSchema,
} from '../validations/menu-items.validation';

const router = Router();

router.use(authenticate);

router.get('/', MenuItemsController.getMenuItems);
router.post('/', validateRequest(createMenuItemSchema), MenuItemsController.createMenuItem);
router.get('/:id', MenuItemsController.getMenuItem);
router.put('/:id', validateRequest(updateMenuItemSchema), MenuItemsController.updateMenuItem);
router.delete('/:id', MenuItemsController.deleteMenuItem);
router.patch('/:id/toggle-availability', MenuItemsController.toggleAvailability);
router.get('/category/:categoryId', MenuItemsController.getMenuItemsByCategory);
router.get('/available/all', MenuItemsController.getAvailableMenuItems);

export default router;