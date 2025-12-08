// routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes';
import ordersRoutes from './orders.routes';
import usersRoutes from './users.routes';
import categoriesRoutes from './categories.routes';
import menuItemsRoutes from './menu-items.routes';
import customersRoutes from './customers.routes';
import ridersRoutes from './riders.routes';
import expensesRoutes from './expenses.routes';
import businessInfoRoutes from './business-info.routes';
import reportsRoutes from './reports.routes';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/orders', ordersRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/menu-items', menuItemsRoutes);
router.use('/customers', customersRoutes);
router.use('/riders', ridersRoutes);
router.use('/expenses', expensesRoutes);
router.use('/business-info', businessInfoRoutes);
router.use('/reports', reportsRoutes);

export default router;