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
    deliveryCharge: z.number().nonnegative().default(0),
    paymentStatus: z.enum(['pending', 'completed']).default('pending'),
    specialInstructions: z.string().optional(),
    tableNumber: z.number().int().positive().optional(),
    discountPercent: z.number().min(0).max(100).optional(),
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
    deliveryAddress: z.string().optional().nullable(),
    deliveryNotes: z.string().optional().nullable(),
    deliveryCharge: z.number().nonnegative().optional(),
    paymentStatus: z.enum(['pending', 'completed']).optional(),
    amountTaken: z.number().positive().optional().nullable(),
    returnAmount: z.number().positive().optional().nullable(),
    tableNumber: z.number().int().positive().optional().nullable(),
    specialInstructions: z.string().optional().nullable(),
  }),
});

export const markAsPaidSchema = z.object({
  body: z.object({
    paymentMethod: z.enum(['cash', 'bank_transfer']),
    amountTaken: z.number().positive().optional(),
    returnAmount: z.number().optional(), // Allow negative values for partial payments
  }),
});

export const updateStatusSchema = z.object({
  body: z.object({
    order_status: z.enum(['pending', 'preparing', 'ready', 'completed', 'cancelled']),
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

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
export type MarkAsPaidInput = z.infer<typeof markAsPaidSchema>['body'];
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>['body'];