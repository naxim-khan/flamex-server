// validations/menu-items.validation.ts
import { z } from 'zod';

export const createMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    description: z.string().optional().or(z.literal('')),
    price: z.number().min(0),
    categoryId: z.number().int().positive().optional().nullable(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    available: z.boolean().optional().default(true),
  }),
});

export const updateMenuItemSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    description: z.string().optional().or(z.literal('')),
    price: z.number().min(0).optional(),
    categoryId: z.number().int().positive().optional().nullable(),
    imageUrl: z.string().url().optional().or(z.literal('')),
    available: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});