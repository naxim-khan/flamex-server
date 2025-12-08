// controllers/reports.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ReportsService } from '../services/reports.service';
import ApiResponse from '../common/api-response';
import { parseDateRange } from '../utils/date.utils';

export class ReportsController {
  static async getDailySalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date as string) : new Date();
      const report = await ReportsService.getDailySalesReport(reportDate);
      res.json(ApiResponse.success('Daily sales report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getMonthlySalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { year, month } = req.query;
      const report = await ReportsService.getMonthlySalesReport(
        year ? parseInt(year as string) : new Date().getFullYear(),
        month ? parseInt(month as string) : new Date().getMonth() + 1
      );
      res.json(ApiResponse.success('Monthly sales report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getYearlySalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { year } = req.query;
      const report = await ReportsService.getYearlySalesReport(
        year ? parseInt(year as string) : new Date().getFullYear()
      );
      res.json(ApiResponse.success('Yearly sales report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderSummaryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getOrderSummaryReport(start as string, end as string);
      res.json(ApiResponse.success('Order summary report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderTimelineReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, interval } = req.query;
      const report = await ReportsService.getOrderTimelineReport(start as string, end as string, interval as 'hourly' | 'daily' | 'weekly' | 'monthly');
      res.json(ApiResponse.success('Order timeline report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getTopSellingItemsReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, limit = '10' } = req.query;
      const report = await ReportsService.getTopSellingItemsReport(start as string, end as string, parseInt(limit as string));
      res.json(ApiResponse.success('Top selling items report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getLowStockItemsReport(req: Request, res: Response, next: NextFunction) {
    try {
      // Note: This would need a stock field in menu_items table
      // For now, we'll return items that are not available
      const report = await ReportsService.getLowStockItemsReport();
      res.json(ApiResponse.success('Low stock items report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getTopCustomersReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, limit = '10' } = req.query;
      const report = await ReportsService.getTopCustomersReport(start as string, end as string, parseInt(limit as string));
      res.json(ApiResponse.success('Top customers report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerLoyaltyReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getCustomerLoyaltyReport(start as string, end as string);
      res.json(ApiResponse.success('Customer loyalty report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getRiderPerformanceReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getRiderPerformanceReport(start as string, end as string);
      res.json(ApiResponse.success('Rider performance report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getFinancialSummaryReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getFinancialSummaryReport(start as string, end as string);
      res.json(ApiResponse.success('Financial summary report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getProfitLossReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getProfitLossReport(start as string, end as string);
      res.json(ApiResponse.success('Profit loss report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getDeliveryOverviewReport(start as string, end as string);
      res.json(ApiResponse.success('Delivery overview report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryAreaAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end } = req.query;
      const report = await ReportsService.getDeliveryAreaAnalysis(start as string, end as string);
      res.json(ApiResponse.success('Delivery area analysis retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryCODOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status = 'pending', start, end } = req.query;
      const report = await ReportsService.getDeliveryCODOrders(
        status as 'pending' | 'received',
        start as string,
        end as string
      );
      res.json(ApiResponse.success('COD orders retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }
}