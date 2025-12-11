import { Prisma } from '../generated/prisma/client';
import { OrdersRepository } from '../repositories/orders.repository';
import ApiError from '../common/errors/ApiError';
import {
  CreateOrderInput,
  UpdateOrderInput,
  OrderFilter,
  DateRange,
} from '../types';

export class OrdersService {
  static async createOrder(data: CreateOrderInput) {
    const {
      items,
      totalAmount,
      paymentMethod,
      amountTaken,
      returnAmount,
      orderType,
      customerId,
      deliveryAddress,
      deliveryNotes,
      deliveryCharge,
      paymentStatus,
      specialInstructions,
      tableNumber,
      discountPercent = 0,
    } = data;

    // Calculate order number
    const orderNumber = await OrdersRepository.getNextOrderNumber();

    // Calculate subtotal from items
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Apply discount and delivery charge to calculate final total
    const discountAmount = subtotal * (discountPercent / 100);
    const finalTotalAmount = (subtotal - discountAmount) + (deliveryCharge || 0);

    // Prepare order data
    const orderData: Prisma.OrderCreateInput = {
      totalAmount: finalTotalAmount,
      subtotal: subtotal,
      discountPercent: discountPercent || 0,
      paymentMethod,
      orderType: orderType || 'dine_in',
      orderStatus: 'pending',
      paymentStatus: paymentStatus || (paymentMethod === 'cash' ? 'pending' : 'completed'),
      orderNumber,
      deliveryCharge: deliveryCharge || 0,
      deliveryAddress,
      deliveryNotes,
      specialInstructions,
      tableNumber,
      cashierName: 'Cashier', // Will be updated from session
    };

    // Handle delivery-specific data
    if (orderType === 'delivery') {
      if (!customerId) {
        throw new ApiError(400, 'Customer is required for delivery orders');
      }
      orderData.customer = { connect: { id: customerId } };
      orderData.deliveryStatus = 'pending';
    }

    // Handle payment data
    if (paymentMethod === 'cash') {
      if (amountTaken && returnAmount) {
        orderData.amountTaken = amountTaken;
        orderData.returnAmount = returnAmount;
      }
    } else {
      orderData.amountTaken = null;
      orderData.returnAmount = null;
    }

    // Check table availability for dine-in
    if (orderType === 'dine_in' && tableNumber) {
      const occupiedTables = await OrdersRepository.getTableAvailability();
      const isTableOccupied = occupiedTables.some(
        (table) => table.tableNumber === tableNumber,
      );
      if (isTableOccupied) {
        throw new ApiError(400, `Table #${tableNumber} is already occupied`);
      }
    }

    // Validate menu items exist
    if (items && items.length > 0) {
      const menuItemIds = items.map(item => item.menuItemId);
      const existingMenuItems = await OrdersRepository.validateMenuItems(menuItemIds);

      if (existingMenuItems.length !== menuItemIds.length) {
        const foundIds = existingMenuItems.map(item => item.id);
        const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
        throw new ApiError(400, `Menu items not found: ${missingIds.join(', ')}`);
      }
    }

    // Create order with items in a transaction
    const order = await OrdersRepository.createOrderWithItems(orderData, items || []);

    // Update customer stats if delivery order
    if (orderType === 'delivery' && customerId) {
      await OrdersRepository.updateCustomerStats(customerId);
    }

    return order;
  }

  static async getOrderById(id: number) {
    const order = await OrdersRepository.findOrderById(id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }
    return order;
  }

  static async updateOrder(id: number, data: UpdateOrderInput) {
    const {
      paymentMethod,
      totalAmount,
      items,
      changeReason,
      orderType,
      customerId,
      deliveryAddress,
      deliveryNotes,
      deliveryCharge,
      paymentStatus,
      amountTaken,
      returnAmount,
      tableNumber,
      specialInstructions,
      editedBy,
      ipAddress,
    } = data;

    // Get existing order
    const existingOrder = await OrdersRepository.findOrderById(id);
    if (!existingOrder) {
      throw new ApiError(404, 'Order not found');
    }

    // Validate menu items if provided
    if (items && items.length > 0) {
      const menuItemIds = items.map(item => item.menuItemId);
      const existingMenuItems = await OrdersRepository.validateMenuItems(menuItemIds);

      if (existingMenuItems.length !== menuItemIds.length) {
        const foundIds = existingMenuItems.map(item => item.id);
        const missingIds = menuItemIds.filter(id => !foundIds.includes(id));
        throw new ApiError(400, `Menu items not found: ${missingIds.join(', ')}`);
      }
    }

    // Save edit history
    await OrdersRepository.createOrderEditHistory({
      order: { connect: { id } },
      editedBy: editedBy || 'System',
      oldTotalAmount: existingOrder.totalAmount,
      oldPaymentMethod: existingOrder.paymentMethod,
      oldAmountTaken: existingOrder.amountTaken,
      oldReturnAmount: existingOrder.returnAmount,
      oldItems: JSON.stringify(
        existingOrder.orderItems.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
        })),
      ),
      newTotalAmount: totalAmount,
      newPaymentMethod: paymentMethod,
      newAmountTaken: amountTaken,
      newReturnAmount: returnAmount,
      newItems: JSON.stringify(items || []),
      changeReason: changeReason || 'Order updated',
      ipAddress,
    });

    // Prepare update data
    const updateData: Prisma.OrderUpdateInput = {
      totalAmount,
      paymentMethod,
      orderType,
      paymentStatus,
      deliveryAddress,
      deliveryNotes,
      deliveryCharge,
      specialInstructions,
      tableNumber,
    };

    // Update customer if changed
    if (customerId !== undefined) {
      updateData.customer = customerId
        ? { connect: { id: customerId } }
        : { disconnect: true };
    }

    // Update payment data
    if (paymentMethod === 'cash') {
      updateData.amountTaken = amountTaken;
      updateData.returnAmount = returnAmount;
    } else {
      updateData.amountTaken = null;
      updateData.returnAmount = null;
    }

    // Update order with items if provided
    const updatedOrder = await OrdersRepository.updateOrderWithItems(id, updateData, items);

    // Update stats if customer changed
    if (existingOrder.customerId !== customerId) {
      if (existingOrder.customerId) {
        await OrdersRepository.updateCustomerStats(existingOrder.customerId);
      }
      if (customerId) {
        await OrdersRepository.updateCustomerStats(customerId);
      }
    }

    return updatedOrder;
  }

  static async getOrders(filter: OrderFilter) {
    return await OrdersRepository.findOrders(filter);
  }

  static async getDineInOrders(filter: {
    status?: 'pending' | 'completed';
    startDate?: Date;
    endDate?: Date;
  }) {
    return await OrdersRepository.findDineInOrders(filter);
  }

  static async getDineInStats() {
    return await OrdersRepository.getDineInStats();
  }

  static async getDeliveryStats() {
    return await OrdersRepository.getDeliveryStats();
  }

  static async getDeliveryOrders(filter: {
    status?: 'pending' | 'completed';
    startDate?: Date;
    endDate?: Date;
  }) {
    return await OrdersRepository.findDeliveryOrders(filter);
  }

  static async getOrderStatistics(range: DateRange) {
    return await OrdersRepository.getOrderStatistics(range);
  }

  static async getItemsSalesReport(range: DateRange) {
    return await OrdersRepository.getItemsSalesReport(range);
  }

  static async markOrderAsPaid(
    id: number,
    data: {
      paymentMethod: 'cash' | 'bank_transfer';
      amountTaken?: number;
      returnAmount?: number;
    },
  ) {
    const order = await OrdersRepository.findOrderById(id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    const updateData: Prisma.OrderUpdateInput = {
      paymentMethod: data.paymentMethod,
      paymentStatus: 'completed',
    };

    if (data.paymentMethod === 'cash') {
      if (!data.amountTaken) {
        throw new ApiError(400, 'Amount taken is required for cash payments');
      }
      // Allow partial payments - if amountTaken is less than total, returnAmount will be negative
      updateData.amountTaken = data.amountTaken;
      // Calculate returnAmount: positive if change given, negative if amount is less than total
      updateData.returnAmount = data.returnAmount !== undefined 
        ? data.returnAmount 
        : data.amountTaken - Number(order.totalAmount);
    } else {
      updateData.amountTaken = null;
      updateData.returnAmount = null;
    }

    return await OrdersRepository.updateOrder(id, updateData);
  }

  static async updateOrderStatus(
    id: number,
    status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled',
  ) {
    const order = await OrdersRepository.findOrderById(id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    return await OrdersRepository.updateOrder(id, { orderStatus: status });
  }

  static async updateDeliveryStatus(
    id: number,
    status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled',
  ) {
    const order = await OrdersRepository.findOrderById(id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.orderType !== 'delivery') {
      throw new ApiError(400, 'Only delivery orders have delivery status');
    }

    const updateData: Prisma.OrderUpdateInput = {
      deliveryStatus: status,
    };

    if (status === 'delivered' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
      updateData.paymentStatus = 'completed';
    }

    const updatedOrder = await OrdersRepository.updateOrder(id, updateData);

    // Update rider stats if delivered
    if (status === 'delivered' && order.riderId) {
      await OrdersRepository.updateRiderStats(order.riderId);
    }

    // Update customer stats if delivered
    if (status === 'delivered' && order.customerId) {
      await OrdersRepository.updateCustomerStats(order.customerId);
    }

    return updatedOrder;
  }

  static async assignRiderToOrder(id: number, riderId: number) {
    const order = await OrdersRepository.findOrderById(id);
    if (!order) {
      throw new ApiError(404, 'Order not found');
    }

    if (order.orderType !== 'delivery') {
      throw new ApiError(400, 'Only delivery orders can have riders assigned');
    }

    return await OrdersRepository.updateOrder(id, {
      rider: { connect: { id: riderId } },
      assignedAt: new Date(),
    });
  }

  static async getTableAvailability() {
    return await OrdersRepository.getTableAvailability();
  }

  static async getOrderEditHistory(orderId: number) {
    return await OrdersRepository.getOrderEditHistory(orderId);
  }
}