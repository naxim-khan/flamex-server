// routes/reports.routes.ts
import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middlewares/auth.middlewares';

const router = Router();

router.use(authenticate);

// Sales Reports
router.get('/sales/daily', ReportsController.getDailySalesReport);
router.get('/sales/monthly', ReportsController.getMonthlySalesReport);
router.get('/sales/yearly', ReportsController.getYearlySalesReport);

// Order Reports
router.get('/orders/summary', ReportsController.getOrderSummaryReport);
router.get('/orders/timeline', ReportsController.getOrderTimelineReport);

// Inventory Reports
router.get('/inventory/sales', ReportsController.getTopSellingItemsReport);
router.get('/inventory/low-stock', ReportsController.getLowStockItemsReport);

// Customer Reports
router.get('/customers/top', ReportsController.getTopCustomersReport);
router.get('/customers/loyalty', ReportsController.getCustomerLoyaltyReport);

// Rider Reports
router.get('/riders/performance', ReportsController.getRiderPerformanceReport);

// Financial Reports
router.get('/financial/summary', ReportsController.getFinancialSummaryReport);
router.get('/financial/profit-loss', ReportsController.getProfitLossReport);

// Delivery Reports
router.get('/overview', ReportsController.getDeliveryOverview);
router.get('/area-analysis', ReportsController.getDeliveryAreaAnalysis);
router.get('/pending-cod', ReportsController.getDeliveryCODOrders);

export default router;