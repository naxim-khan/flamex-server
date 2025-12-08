// repositories/expenses.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';
import { DateRange } from '../types';

export class ExpensesRepository {
  static async findExpenses(filter?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {};

    if (filter?.startDate && filter?.endDate) {
      // Filter by expenseDate if available, otherwise createdAt
      const start = new Date(filter.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filter.endDate);
      end.setHours(23, 59, 59, 999);
      
      // Use expenseDate if it exists, otherwise use createdAt
      where.OR = [
        {
          expenseDate: {
            gte: start,
            lte: end,
          },
        },
        {
          AND: [
            { expenseDate: null },
            {
              createdAt: {
                gte: start,
                lte: end,
              },
            },
          ],
        },
      ];
    }

    if (filter?.category) {
      where.category = { contains: filter.category, mode: 'insensitive' };
    }

    if (filter?.search) {
      where.description = { contains: filter.search, mode: 'insensitive' };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findExpenseById(id: number) {
    return await prisma.expense.findUnique({
      where: { id },
    });
  }

  static async createExpense(data: Prisma.ExpenseCreateInput) {
    return await prisma.expense.create({ data });
  }

  static async updateExpense(id: number, data: Prisma.ExpenseUpdateInput) {
    return await prisma.expense.update({
      where: { id },
      data,
    });
  }

  static async deleteExpense(id: number) {
    return await prisma.expense.delete({
      where: { id },
    });
  }

  static async getExpenseStatistics(range: DateRange) {
    const { startDate, endDate } = range;

    const where: Prisma.ExpenseWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    const [total, byCategory, byPaymentMethod] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ['category'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ['paymentMethod'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalAmount: total._sum.amount || 0,
      totalCount: total._count.id || 0,
      averageAmount: total._count.id > 0 ? Number(total._sum.amount) / total._count.id : 0,
      byCategory: byCategory.map(cat => ({
        category: cat.category || 'Uncategorized',
        totalAmount: cat._sum.amount || 0,
        count: cat._count.id,
      })),
      byPaymentMethod: byPaymentMethod.map(pm => ({
        paymentMethod: pm.paymentMethod,
        totalAmount: pm._sum.amount || 0,
        count: pm._count.id,
      })),
    };
  }

  static async findExpenseCategories() {
    return await prisma.expense.findMany({
      select: { category: true },
      distinct: ['category'],
      where: {
        category: { not: null },
      },
    });
  }
}