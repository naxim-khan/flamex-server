// controllers/expenses.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ExpensesService } from '../services/expenses.service';
import ApiResponse from '../common/api-response';
import { parseDateRange } from '../utils/date.utils';

export class ExpensesController {
  static async getExpenses(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        startDate,
        endDate,
        category,
        page = '1',
        limit = '50',
        search,
      } = req.query;

      const expenses = await ExpensesService.getExpenses({
        startDate: startDate as string,
        endDate: endDate as string,
        category: category as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
      });
      res.json(ApiResponse.success('Expenses retrieved successfully', expenses));
    } catch (error) {
      next(error);
    }
  }

  static async getExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const expense = await ExpensesService.getExpenseById(parseInt(id));
      res.json(ApiResponse.success('Expense retrieved successfully', expense));
    } catch (error) {
      next(error);
    }
  }

  static async createExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const expense = await ExpensesService.createExpense(req.body);
      res.status(201).json(ApiResponse.success('Expense created successfully', expense));
    } catch (error) {
      next(error);
    }
  }

  static async updateExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const expense = await ExpensesService.updateExpense(parseInt(id), req.body);
      res.json(ApiResponse.success('Expense updated successfully', expense));
    } catch (error) {
      next(error);
    }
  }

  static async deleteExpense(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await ExpensesService.deleteExpense(parseInt(id));
      res.json(ApiResponse.success('Expense deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const { start, end, filter } = req.query;
      
      let dateRange;
      if (filter === 'today') {
        const today = new Date();
        dateRange = {
          startDate: new Date(today.setHours(0, 0, 0, 0)),
          endDate: new Date(today.setHours(23, 59, 59, 999)),
        };
      } else if (filter === 'this_month') {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        dateRange = {
          startDate: monthStart,
          endDate: today,
        };
      } else {
        dateRange = parseDateRange(start as string, end as string);
      }

      const statistics = await ExpensesService.getExpenseStatistics(dateRange);
      res.json(ApiResponse.success('Expense statistics retrieved successfully', statistics));
    } catch (error) {
      next(error);
    }
  }

  static async getExpenseCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await ExpensesService.getExpenseCategories();
      res.json(ApiResponse.success('Expense categories retrieved successfully', categories));
    } catch (error) {
      next(error);
    }
  }
}