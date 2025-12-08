// routes/orders.routes.ts
import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { authenticate, requireManager } from '../middlewares/auth.middlewares';
import {
  createOrderSchema,
  updateOrderSchema,
  markAsPaidSchema,
  updateStatusSchema,
  assignRiderSchema,
  updateDeliveryStatusSchema,
} from '../validations/orders.validation';

const router = Router();

// Protected routes
router.use(authenticate);

// Order management
router.post('/', validateRequest(createOrderSchema), OrdersController.createOrder);
router.get('/', OrdersController.getOrders);
router.get('/:id', OrdersController.getOrder);
router.get('/:id/items', OrdersController.getOrderItems);
router.put('/:id', validateRequest(updateOrderSchema), OrdersController.updateOrder);
router.delete('/:id', requireManager, OrdersController.cancelOrder);

// Dine-in orders
// get all orders
router.get('/dine-in/all', OrdersController.getOrders);
router.get('/dine-in/active', OrdersController.getDineInOrders);
router.get('/dine-in/stats', OrdersController.getDineInStats);
router.get('/dine-in/tables/availability', OrdersController.getTableAvailability);

// Delivery orders
// get all delivery orders
router.get('/delivery/stats', OrdersController.getDeliveryStats);
router.get('/delivery', OrdersController.getDeliveryOrders);
// routes/orders.routes.ts - Update delivery routes
router.get('/delivery/active', (req, res, next) => {
  req.query.status = 'active'; // Mark as active delivery orders
  OrdersController.getDeliveryOrders(req, res, next);
});

router.get('/delivery/assigned', (req, res, next) => {
  req.query.assigned = 'true'; // Mark as assigned orders only
  OrdersController.getDeliveryOrders(req, res, next);
});

router.get('/delivery/today', (req, res, next) => {
  req.query.today = 'true'; // Mark as today's orders
  OrdersController.getDeliveryOrders(req, res, next);
});

// Order status updates
router.put('/:id/mark-paid', validateRequest(markAsPaidSchema), OrdersController.markOrderAsPaid);
router.put('/:id/status', validateRequest(updateStatusSchema), OrdersController.updateOrderStatus);
router.put('/:id/delivery/status', validateRequest(updateDeliveryStatusSchema), OrdersController.updateDeliveryStatus);
router.put('/:id/assign-rider', validateRequest(assignRiderSchema), OrdersController.assignRider);
router.put('/:id/cancel', OrdersController.cancelOrder);
router.get('/:id/history', OrdersController.getOrderEditHistory);
// router.get('/items-sales', OrdersController.getItemsSalesReport);


// Reports
router.get('/statistics/summary', OrdersController.getOrderStatistics);
router.get('/reports/sales', OrdersController.getItemsSalesReport);

// History
router.get('/:id/history', OrdersController.getOrderEditHistory);

export default router;