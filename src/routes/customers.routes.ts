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

// Specific routes must come before parameterized routes
router.get('/search', CustomersController.searchCustomers);
router.get('/search-by-phone', CustomersController.searchCustomersByPhone);
router.get('/phone/:phone', CustomersController.getCustomerByPhone);
router.post('/find-or-create', CustomersController.findOrCreateCustomer);

// Parameterized routes
router.get('/', CustomersController.getCustomers);
router.post('/', validateRequest(createCustomerSchema), CustomersController.createCustomer);
router.get('/:id/orders', CustomersController.getCustomerOrders);
router.get('/:id/addresses', CustomersController.getCustomerAddresses);
router.post('/:id/addresses', CustomersController.createCustomerAddress);
router.get('/:id', CustomersController.getCustomer);
router.put('/:id', validateRequest(updateCustomerSchema), CustomersController.updateCustomer);
router.delete('/:id', CustomersController.deleteCustomer);

// Address routes
router.put('/addresses/:addressId', CustomersController.updateCustomerAddress);
router.delete('/addresses/:addressId', CustomersController.deleteCustomerAddress);

export default router;