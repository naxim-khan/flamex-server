// validations/orders.validation.ts
import { z } from 'zod';

const orderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const createOrderSchema = z.object({
  body: z.object({
    items: z.array(orderItemSchema).min(1, 'At least one item is required'),
    totalAmount: z.number().positive(),
    paymentMethod: z.enum(['cash', 'bank_transfer']).default('cash'),
    amountTaken: z.number().positive().optional(),
    returnAmount: z.number().positive().optional(),
    orderType: z.enum(['dine_in', 'delivery']).default('dine_in'),
    customerId: z.number().int().positive().optional(),
    deliveryAddress: z.string().optional(),
    deliveryNotes: z.string().optional(),
    deliveryCharge: z.number().default(0),
    paymentStatus: z.enum(['pending', 'completed']).optional(),
    specialInstructions: z.string().optional(),
    tableNumber: z.number().int().positive().optional(),
  }),
});

export const updateOrderSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['cash', 'bank_transfer']).optional(),
    totalAmount: z.number().positive().optional(),
    items: z.array(orderItemSchema).optional(),
    changeReason: z.string().optional(),
    orderType: z.enum(['dine_in', 'delivery']).optional(),
    customerId: z.number().int().positive().optional().nullable(),
    deliveryAddress: z.string().optional(),
    deliveryNotes: z.string().optional(),
    deliveryCharge: z.number().optional(),
    paymentStatus: z.enum(['pending', 'completed']).optional(),
    amountTaken: z.number().positive().optional().nullable(),
    returnAmount: z.number().positive().optional().nullable(),
    tableNumber: z.number().int().positive().optional().nullable(),
    specialInstructions: z.string().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const markAsPaidSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['cash', 'bank_transfer']),
    amountTaken: z.number().positive().optional(),
    returnAmount: z.number().positive().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    orderStatus: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const updateDeliveryStatusSchema = z.object({
  body: z.object({
    deliveryStatus: z.enum(['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const assignRiderSchema = z.object({
  body: z.object({
    riderId: z.number().int().positive(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(100),
    password: z.string().min(6),
    fullName: z.string().min(1).max(200),
    role: z.enum(['admin', 'manager']),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(200).optional(),
    role: z.enum(['admin', 'manager']).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    password: z.string().min(6).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'ID must be a number'),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(1).max(200).optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
  }),
});