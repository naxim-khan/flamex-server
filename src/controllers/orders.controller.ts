import { Request, Response, NextFunction } from 'express';
import { OrdersService } from '../services/orders.service';
import ApiResponse from '../common/api-response';
import ApiError from '../common/errors/ApiError';
import { parseDateRange } from '../utils/date.utils';

export class OrdersController {
  static async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await OrdersService.createOrder(req.body);
      res.status(201).json(ApiResponse.success('Order created successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrdersService.getOrderById(parseInt(id));
      res.json(ApiResponse.success('Order retrieved successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrdersService.getOrderById(parseInt(id));
      // Map to flatten structure if needed, or return as is
      res.json(ApiResponse.success('Order items retrieved successfully', order.orderItems));
    } catch (error) {
      next(error);
    }
  }

  static async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const data = {
        ...req.body,
        editedBy: req.user?.fullName || req.user?.username || 'System',
        ipAddress: req.ip || req.connection.remoteAddress,
      };
      const order = await OrdersService.updateOrder(parseInt(id), data);
      res.json(ApiResponse.success('Order updated successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        orderType,
        paymentStatus,
        orderStatus,
        deliveryStatus,
        startDate,
        endDate,
        page = '1',
        limit = '50',
        search,
      } = req.query;

      // Log incoming request parameters
      console.log('getOrders request params:', {
        orderType,
        paymentStatus,
        orderStatus,
        deliveryStatus,
        startDate,
        endDate,
        page,
        limit,
        search
      });

      const filter = {
        orderType: orderType ? (orderType as any) : undefined,
        paymentStatus: paymentStatus ? (paymentStatus as any) : undefined,
        orderStatus: orderStatus ? (orderStatus as any) : undefined,
        deliveryStatus: deliveryStatus ? (deliveryStatus as any) : undefined,
        startDate: startDate as string,
        endDate: endDate as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
      };

      const result = await OrdersService.getOrders(filter);
      
      console.log('getOrders result:', {
        total: result.total,
        ordersCount: result.orders?.length || 0,
        page: result.page,
        limit: result.limit
      });
      
      res.json(ApiResponse.success('Orders retrieved successfully', result));
    } catch (error) {
      next(error);
    }
  }

  static async getDineInOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, start, end } = req.query;
      const filter = {
        status: (status as 'pending' | 'completed') || 'pending',
        startDate: start ? new Date(start as string) : undefined,
        endDate: end ? new Date(end as string) : undefined,
      };

      const orders = await OrdersService.getDineInOrders(filter);
      res.json(ApiResponse.success('Dine-in orders retrieved successfully', orders));
    } catch (error) {
      next(error);
    }
  }

  static async getDineInStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrdersService.getDineInStats();
      res.json(ApiResponse.success('Dine-in stats retrieved successfully', stats));
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await OrdersService.getDeliveryStats();
      res.json(ApiResponse.success('Delivery stats retrieved successfully', stats));
    } catch (error) {
      next(error);
    }
  }

  static async getDeliveryOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, start, end } = req.query;
      const filter = {
        status: (status as 'pending' | 'completed') || 'pending',
        startDate: start ? new Date(start as string) : undefined,
        endDate: end ? new Date(end as string) : undefined,
      };

      const orders = await OrdersService.getDeliveryOrders(filter);
      res.json(ApiResponse.success('Delivery orders retrieved successfully', orders));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, filter } = req.query;

      let dateRange;
      if (filter === 'today') {
        const today = new Date();
        dateRange = {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else if (filter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dateRange = {
          startDate: new Date(yesterday.setHours(0, 0, 0, 0)),
          endDate: new Date(yesterday.setHours(23, 59, 59, 999)),
        };
      } else if (filter === 'this_week') {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        dateRange = {
          startDate: new Date(weekStart.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else if (filter === 'this_month') {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateRange = {
          startDate: new Date(monthStart.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else {
        dateRange = parseDateRange(start as string, end as string);
      }

      const statistics = await OrdersService.getOrderStatistics(dateRange);
      res.json(ApiResponse.success('Statistics retrieved successfully', statistics));
    } catch (error) {
      next(error);
    }
  }

  static async getItemsSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, filter } = req.query;

      let dateRange;
      if (filter === 'today') {
        const today = new Date();
        dateRange = {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else {
        dateRange = parseDateRange(start as string, end as string);
      }

      const report = await OrdersService.getItemsSalesReport(dateRange);
      res.json(ApiResponse.success('Sales report retrieved successfully', report));
    } catch (error) {
      next(error);
    }
  }

  static async markOrderAsPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { paymentMethod, amountTaken, returnAmount } = req.body;

      const order = await OrdersService.markOrderAsPaid(parseInt(id), {
        paymentMethod,
        amountTaken,
        returnAmount,
      });

      res.json(ApiResponse.success('Order marked as paid successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { order_status } = req.body;

      const order = await OrdersService.updateOrderStatus(
        parseInt(id),
        order_status,
      );

      res.json(ApiResponse.success('Order status updated successfully', order));
    } catch (error) {
      console.error('[DEBUG] Update failed:', error);
      next(error);
    }
  }

  static async updateDeliveryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { deliveryStatus } = req.body;

      const order = await OrdersService.updateDeliveryStatus(
        parseInt(id),
        deliveryStatus,
      );

      res.json(ApiResponse.success('Delivery status updated successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async assignRider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { riderId } = req.body;

      const order = await OrdersService.assignRiderToOrder(
        parseInt(id),
        riderId,
      );

      res.json(ApiResponse.success('Rider assigned successfully', order));
    } catch (error) {
      next(error);
    }
  }

  static async getTableAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const tables = await OrdersService.getTableAvailability();
      res.json(ApiResponse.success('Table availability retrieved successfully', {
        occupied_tables: tables,
      }));
    } catch (error) {
      next(error);
    }
  }

  static async getOrderEditHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const history = await OrdersService.getOrderEditHistory(parseInt(id));
      res.json(ApiResponse.success('Order edit history retrieved successfully', history));
    } catch (error) {
      next(error);
    }
  }

  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const order = await OrdersService.updateOrderStatus(parseInt(id), 'cancelled');
      res.json(ApiResponse.success('Order cancelled successfully', order));
    } catch (error) {
      next(error);
    }
  }
}