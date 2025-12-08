// services/expenses.service.ts
import { ExpensesRepository } from '../repositories/expenses.repository';
import ApiError from '../common/errors/ApiError';
import { DateRange } from '../types';

export class ExpensesService {
  static async getExpenses(filter?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return await ExpensesRepository.findExpenses(filter);
  }

  static async getExpenseById(id: number) {
    const expense = await ExpensesRepository.findExpenseById(id);
    if (!expense) {
      throw new ApiError(404, 'Expense not found');
    }
    return expense;
  }

  static async createExpense(data: {
    description: string;
    amount: number;
    category?: string;
    paymentMethod?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    expenseDate?: Date;
  }) {
    return await ExpensesRepository.createExpense({
      ...data,
      paymentMethod: data.paymentMethod || 'cash',
      quantity: data.quantity || 1,
      unit: data.unit || 'PCS',
    });
  }

  static async updateExpense(id: number, data: {
    description?: string;
    amount?: number;
    category?: string;
    paymentMethod?: string;
    quantity?: number;
    unit?: string;
    unitPrice?: number;
    expenseDate?: Date;
  }) {
    const existingExpense = await ExpensesRepository.findExpenseById(id);
    if (!existingExpense) {
      throw new ApiError(404, 'Expense not found');
    }

    return await ExpensesRepository.updateExpense(id, data);
  }

  static async deleteExpense(id: number) {
    const existingExpense = await ExpensesRepository.findExpenseById(id);
    if (!existingExpense) {
      throw new ApiError(404, 'Expense not found');
    }

    return await ExpensesRepository.deleteExpense(id);
  }

  static async getExpenseStatistics(range: DateRange) {
    return await ExpensesRepository.getExpenseStatistics(range);
  }

  static async getExpenseCategories() {
    const expenses = await ExpensesRepository.findExpenseCategories();
    const categories = expenses.map(expense => expense.category).filter(Boolean);
    return [...new Set(categories)];
  }
}