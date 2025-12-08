// routes/customers.routes.ts
import { Router } from 'express';
import { CustomersController } from '../controllers/customers.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate } from '../middlewares/auth.middlewares';
import {
  createCustomerSchema,
  updateCustomerSchema,
} from '../validations/customers.validation';

const router = Router();

router.use(authenticate);

router.get('/', CustomersController.getCustomers);
router.post('/', validateRequest(createCustomerSchema), CustomersController.createCustomer);
router.get('/:id', CustomersController.getCustomer);
router.put('/:id', validateRequest(updateCustomerSchema), CustomersController.updateCustomer);
router.delete('/:id', CustomersController.deleteCustomer);
router.get('/:id/orders', CustomersController.getCustomerOrders);
router.get('/search', CustomersController.searchCustomers);
router.get('/phone/:phone', CustomersController.getCustomerByPhone);

export default router;