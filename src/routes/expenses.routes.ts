// routes/expenses.routes.ts
import { Router } from 'express';
import { ExpensesController } from '../controllers/expenses.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import {
  createExpenseSchema,
  updateExpenseSchema,
} from '../validations/expenses.validation';

const router = Router();

router.use(authenticate);

router.get('/', ExpensesController.getExpenses);
router.post('/', validateRequest(createExpenseSchema), ExpensesController.createExpense);
router.get('/:id', ExpensesController.getExpense);
router.put('/:id', validateRequest(updateExpenseSchema), ExpensesController.updateExpense);
router.delete('/:id', ExpensesController.deleteExpense);
router.get('/statistics/summary', ExpensesController.getExpenseStatistics);
router.get('/categories/list', ExpensesController.getExpenseCategories);

export default router;