// validations/expenses.validation.ts
import { z } from 'zod';

export const createExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1, 'Description is required'),
    amount: z.number().positive('Amount must be positive'),
    category: z.string().optional().or(z.literal('')),
    paymentMethod: z.enum(['cash', 'bank_transfer']).default('cash'),
    quantity: z.number().positive().default(1),
    unit: z.string().default('PCS'),
    unitPrice: z.number().positive().optional(),
    expenseDate: z.string().datetime().optional(),
  }),
});

export const updateExpenseSchema = z.object({
  body: z.object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    category: z.string().optional().or(z.literal('')),
    paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
    quantity: z.number().positive().optional(),
    unit: z.string().optional(),
    unitPrice: z.number().positive().optional(),
    expenseDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});