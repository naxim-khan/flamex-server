// validations/business-info.validation.ts
import { z } from 'zod';

export const createBusinessInfoSchema = z.object({
  body: z.object({
    key: z.string().min(1, 'Key is required').max(255),
    value: z.string().min(1, 'Value is required'),
  }),
});

export const updateBusinessInfoSchema = z.object({
  body: z.object({
    value: z.string().min(1, 'Value is required'),
  }),
  params: z.object({
    key: z.string().min(1, 'Key is required'),
  }),
});