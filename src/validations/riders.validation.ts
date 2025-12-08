// validations/riders.validation.ts
import { z } from 'zod';

export const createRiderSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255),
    phone: z.string().min(1, 'Phone is required').max(20),
    address: z.string().optional().or(z.literal('')),
    cnic: z.string().max(20).optional().or(z.literal('')),
  }),
});

export const updateRiderSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    phone: z.string().min(1).max(20).optional(),
    address: z.string().optional().or(z.literal('')),
    cnic: z.string().max(20).optional().or(z.literal('')),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});