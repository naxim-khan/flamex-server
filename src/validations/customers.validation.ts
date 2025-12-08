// validations/customers.validation.ts
import { z } from 'zod';

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    phone: z.string().min(1, 'Phone is required').max(20),
    backupPhone: z.string().max(20).optional().or(z.literal('')),
    address: z.string().min(1, 'Address is required'),
    notes: z.string().optional().or(z.literal('')),
  }),
});

export const updateCustomerSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(20).optional(),
    backupPhone: z.string().max(20).optional().or(z.literal('')),
    address: z.string().min(1).optional(),
    notes: z.string().optional().or(z.literal('')),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});