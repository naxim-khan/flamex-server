// routes/categories.routes.ts
import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../validations/categories.validation';

const router = Router();

router.use(authenticate);

router.get('/', CategoriesController.getCategories);
router.post('/', validateRequest(createCategorySchema), CategoriesController.createCategory);
router.get('/:id', CategoriesController.getCategory);
router.put('/:id', validateRequest(updateCategorySchema), CategoriesController.updateCategory);
router.delete('/:id', CategoriesController.deleteCategory);

export default router;