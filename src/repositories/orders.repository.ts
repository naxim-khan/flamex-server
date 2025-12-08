import { Prisma, OrderStatus, DeliveryStatus } from '../generated/prisma/client';
// import { prisma } from '../config/database';
import prisma from '../prismaClient'
import ApiError from '../common/errors/ApiError';
import { OrderFilter, DateRange } from '../types';

export class OrdersRepository {
  static async createOrder(data: Prisma.OrderCreateInput) {
    return await prisma.order.create({ data });
  }

  static async createOrderWithItems(
    orderData: Prisma.OrderCreateInput,
    items: Array<{ menuItemId: number; quantity: number; price: number }>
  ) {
    // Use Prisma 7+ transaction for atomic operation
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          ...orderData,
          orderItems: {
            create: items.map(item => ({
              menuItemId: item.menuItemId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              menuItem: true
            }
          },
          customer: true,
          rider: true
        }
      });
      return order;
    });
  }

  static async validateMenuItems(menuItemIds: number[]) {
    return await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        available: true
      },
      select: { id: true, name: true, price: true }
    });
  }

  static async findOrderById(id: number) {

    return await prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        rider: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    });
  }

  static async updateOrder(id: number, data: Prisma.OrderUpdateInput) {
    return await prisma.order.update({
      where: { id },
      data,
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        },
        customer: true,
        rider: true
      }
    });
  }

  static async updateOrderWithItems(
    id: number,
    orderData: Prisma.OrderUpdateInput,
    items?: Array<{ menuItemId: number; quantity: number; price: number }>
  ) {
    return await prisma.$transaction(async (tx) => {
      // If items are provided, delete old items and create new ones
      if (items && items.length > 0) {
        // Delete existing order items
        await tx.orderItem.deleteMany({
          where: { orderId: id }
        });

        // Update order with new items
        return await tx.order.update({
          where: { id },
          data: {
            ...orderData,
            orderItems: {
              create: items.map(item => ({
                menuItemId: item.menuItemId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            },
            customer: true,
            rider: true
          }
        });
      } else {
        // Just update order data without touching items
        return await tx.order.update({
          where: { id },
          data: orderData,
          include: {
            orderItems: {
              include: {
                menuItem: true
              }
            },
            customer: true,
            rider: true
          }
        });
      }
    });
  }

  static async deleteOrder(id: number) {
    return await prisma.order.delete({
      where: { id },
    });
  }

  static async findOrders(filter: OrderFilter) {
    const {
      orderType,
      paymentStatus,
      orderStatus,
      deliveryStatus,
      startDate,
      endDate,
      page = 1,
      limit = 50,
      search,
    } = filter;

    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      orderStatus: { not: 'cancelled' },
    };

    if (orderType) {
      where.orderType = orderType;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (orderStatus) {
      where.orderStatus = orderStatus;
    }

    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus;
    }

    if (startDate && endDate) {
      // Parse dates and set proper time boundaries
      // Use a more robust approach that accounts for timezone
      // Create dates in local timezone first, then they'll be properly converted
      // PostgreSQL stores timestamps in UTC, so we need to account for that
      
      // Parse date components
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      
      // Create dates at start/end of day in local timezone
      // This ensures we capture the full day in the user's local timezone
      const startLocal = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
      const endLocal = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
      
      // Convert to UTC for database comparison (PostgreSQL stores in UTC)
      // But actually, JavaScript Date objects are already in UTC internally
      // So we can use them directly
      const start = startLocal;
      const end = endLocal;
      
      // Log for debugging
      console.log('Orders date filter:', {
        startDate,
        endDate,
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        startLocal: start.toString(),
        endLocal: end.toString(),
        timezoneOffset: new Date().getTimezoneOffset(),
        serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      where.createdAt = {
        gte: start,
        lte: end,
      };
    } else {
      // If no date filter, check if there are any orders at all (for debugging)
      const totalOrders = await prisma.order.count({ where: { orderStatus: { not: 'cancelled' } } });
      console.log(`Total non-cancelled orders in database: ${totalOrders}`);
    }

    if (search) {
      where.OR = [
        { orderNumber: { equals: parseInt(search) || 0 } },
        { tableNumber: { equals: parseInt(search) || 0 } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { deliveryAddress: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Log the where clause for debugging (but serialize dates properly)
    const dateFilter = where.createdAt;
    const whereForLog = {
      ...where,
      createdAt: dateFilter && typeof dateFilter === 'object' && 'gte' in dateFilter && 'lte' in dateFilter
        ? {
            gte: dateFilter.gte instanceof Date ? dateFilter.gte.toISOString() : String(dateFilter.gte),
            lte: dateFilter.lte instanceof Date ? dateFilter.lte.toISOString() : String(dateFilter.lte)
          }
        : dateFilter
    };
    console.log('Orders query where clause:', JSON.stringify(whereForLog, null, 2));
    
    // Also check what orders exist without date filter and compare with date range
    if (startDate && endDate && dateFilter && typeof dateFilter === 'object' && 'gte' in dateFilter && 'lte' in dateFilter) {
      const allOrdersSample = await prisma.order.findMany({
        where: { orderStatus: { not: 'cancelled' } },
        select: { id: true, createdAt: true, orderType: true, orderStatus: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      const gte = dateFilter.gte;
      const lte = dateFilter.lte;
      console.log('Sample of all non-cancelled orders (last 10):', allOrdersSample.map(o => {
        const orderDate = o.createdAt;
        // Type guard to check if gte and lte are Date objects
        let isInRange = false;
        if (gte instanceof Date && lte instanceof Date) {
          isInRange = orderDate >= gte && orderDate <= lte;
        }
        return {
          id: o.id,
          createdAt: orderDate.toISOString(),
          createdAtLocal: orderDate.toString(),
          orderType: o.orderType,
          orderStatus: o.orderStatus,
          isInRange,
          dateOnly: orderDate.toISOString().split('T')[0]
        };
      }));
      
      // Also check orders within the date range directly
      const ordersInRange = await prisma.order.findMany({
        where: {
          orderStatus: { not: 'cancelled' },
          createdAt: where.createdAt
        },
        select: { id: true, createdAt: true, orderType: true },
        take: 5
      });
      console.log('Orders found with date filter (direct query):', ordersInRange.map(o => ({
        id: o.id,
        createdAt: o.createdAt.toISOString(),
        orderType: o.orderType
      })));
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
          rider: true,
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);
    
    // Log results for debugging
    if (startDate && endDate) {
      console.log(`Found ${orders.length} orders for date range ${startDate} to ${endDate}`);
      if (orders.length > 0) {
        console.log('Sample order dates:', orders.slice(0, 3).map(o => ({
          id: o.id,
          createdAt: o.createdAt.toISOString(),
          createdAtLocal: o.createdAt.toString()
        })));
      }
    }

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async findDineInOrders(filter: {
    status?: 'pending' | 'completed';
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.OrderWhereInput = {
      orderType: 'dine_in',
      orderStatus: { not: 'cancelled' },
    };

    if (filter.status === 'completed') {
      where.paymentStatus = 'completed';
    } else if (filter.status === 'pending') {
      where.paymentStatus = 'pending';
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = {
        gte: filter.startDate,
        lte: filter.endDate,
      };
    }

    return await prisma.order.findMany({
      where,
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { orderNumber: 'desc' },
    });
  }

  static async findDeliveryOrders(filter: {
    status?: 'pending' | 'completed';
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: Prisma.OrderWhereInput = {
      orderType: 'delivery',
      orderStatus: { not: 'cancelled' },
    };

    if (filter.status === 'completed') {
      where.orderStatus = 'completed';
      where.paymentStatus = 'completed';
    } else if (filter.status === 'pending') {
      where.OR = [
        { orderStatus: { not: 'completed' } },
        { paymentStatus: { not: 'completed' } },
      ];
    }

    if (filter.startDate && filter.endDate) {
      where.createdAt = {
        gte: filter.startDate,
        lte: filter.endDate,
      };
    }

    return await prisma.order.findMany({
      where,
      include: {
        customer: true,
        rider: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
      orderBy: { orderNumber: 'desc' },
    });
  }

  static async getDineInStats() {
    const [pendingOrders, completedOrders, pendingRevenue, completedRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          orderType: 'dine_in',
          paymentStatus: 'pending',
          orderStatus: { not: 'cancelled' },
        },
      }),
      prisma.order.count({
        where: {
          orderType: 'dine_in',
          paymentStatus: 'completed',
          orderStatus: { not: 'cancelled' },
        },
      }),
      prisma.order.aggregate({
        where: {
          orderType: 'dine_in',
          paymentStatus: 'pending',
          orderStatus: { not: 'cancelled' },
        },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: {
          orderType: 'dine_in',
          paymentStatus: 'completed',
          orderStatus: { not: 'cancelled' },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    const pendingAmount = pendingRevenue._sum.totalAmount ? Number(pendingRevenue._sum.totalAmount.toString()) : 0;
    const completedAmount = completedRevenue._sum.totalAmount ? Number(completedRevenue._sum.totalAmount.toString()) : 0;

    return {
      pendingOrders,
      completedOrders,
      pendingRevenue: pendingAmount,
      completedRevenue: completedAmount,
      totalOrders: pendingOrders + completedOrders,
      totalRevenue: pendingAmount + completedAmount,
    };
  }

  static async getDeliveryStats() {
    const commonWhere: Prisma.OrderWhereInput = {
      orderType: 'delivery',
      orderStatus: { not: 'cancelled' },
    };

    const [
      pendingPayments,
      receivedPayments,
      pendingDeliveries,
      completedDeliveries,
      codPending,
      cashPayments,
      bankPayments,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { ...commonWhere, paymentStatus: 'pending' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, paymentStatus: 'completed' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, deliveryStatus: { not: 'delivered' } },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, deliveryStatus: 'delivered' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, paymentMethod: 'cash', paymentStatus: 'pending' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, paymentMethod: 'cash' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...commonWhere, paymentMethod: 'bank_transfer' },
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
    ]);

    const formatResult = (agg: any) => ({
      count: agg._count._all || 0,
      total_amount: agg._sum.totalAmount ? Number(agg._sum.totalAmount.toString()) : 0,
    });

    const pending = formatResult(pendingPayments);
    const received = formatResult(receivedPayments);

    return {
      pending_payments: pending,
      received_payments: received,
      pending_deliveries: formatResult(pendingDeliveries),
      completed_deliveries: formatResult(completedDeliveries),
      cod_pending: formatResult(codPending),
      cash_payments: formatResult(cashPayments),
      bank_payments: formatResult(bankPayments),
      total_orders: pending.count + received.count,
      total_revenue: pending.total_amount + received.total_amount,
      average_order_value: 0, // Calculated on frontend or ignored
    };
  }

  static async getOrderStatistics(range: DateRange) {
    const { startDate, endDate } = range;

    const where: Prisma.OrderWhereInput = {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      orderStatus: { not: 'cancelled' },
    };

    const [
      totalOrders,
      totalRevenue,
      dineInOrders,
      deliveryOrders,
      cashOrders,
      bankOrders,
      pendingOrders,
      dineInRevenue,
      deliveryRevenue,
    ] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
      }),
      prisma.order.count({
        where: { ...where, orderType: 'dine_in' },
      }),
      prisma.order.count({
        where: { ...where, orderType: 'delivery' },
      }),
      prisma.order.aggregate({
        where: { ...where, paymentMethod: 'cash' },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.aggregate({
        where: { ...where, paymentMethod: 'bank_transfer' },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.order.count({
        where: { ...where, paymentStatus: 'pending' },
      }),
      prisma.order.aggregate({
        where: { ...where, orderType: 'dine_in' },
        _sum: { totalAmount: true },
      }),
      prisma.order.aggregate({
        where: { ...where, orderType: 'delivery' },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      dineInOrders,
      deliveryOrders,
      cashOrdersCount: cashOrders._count._all || 0,
      cashRevenue: cashOrders._sum.totalAmount || 0,
      bankOrdersCount: bankOrders._count._all || 0,
      bankRevenue: bankOrders._sum.totalAmount || 0,
      pendingOrders,
      dineInRevenue: dineInRevenue._sum.totalAmount || 0,
      deliveryRevenue: deliveryRevenue._sum.totalAmount || 0,
    };
  }

  static async getItemsSalesReport(range: DateRange) {
    const { startDate, endDate } = range;

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          orderStatus: { not: 'cancelled' },
        },
      },
      include: {
        menuItem: true,
        order: true,
      },
    });

    const itemsMap = new Map();

    orderItems.forEach((item) => {
      const key = item.menuItemId;
      if (!itemsMap.has(key)) {
        itemsMap.set(key, {
          itemId: item.menuItemId,
          itemName: item.menuItem.name,
          quantity: 0,
          totalRevenue: 0,
          orders: new Set(),
        });
      }

      const record = itemsMap.get(key);
      record.quantity += item.quantity;
      record.totalRevenue += Number(item.price) * item.quantity;
      record.orders.add(item.orderId);
    });

    return Array.from(itemsMap.values()).map((item) => ({
      ...item,
      orderCount: item.orders.size,
    }));
  }

  static async updateCustomerStats(customerId: number) {
    const [orders, revenue] = await Promise.all([
      prisma.order.count({
        where: {
          customerId,
          orderType: 'delivery',
          orderStatus: { not: 'cancelled' },
        },
      }),
      prisma.order.aggregate({
        where: {
          customerId,
          orderType: 'delivery',
          orderStatus: { not: 'cancelled' },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        totalOrders: orders,
        totalSpent: revenue._sum.totalAmount || 0,
      },
    });
  }

  static async updateRiderStats(riderId: number) {
    const [deliveries, cashCollected] = await Promise.all([
      prisma.order.count({
        where: {
          riderId,
          deliveryStatus: 'delivered',
          orderStatus: { not: 'cancelled' },
        },
      }),
      prisma.order.aggregate({
        where: {
          riderId,
          deliveryStatus: 'delivered',
          paymentMethod: 'cash',
          paymentStatus: 'completed',
          orderStatus: { not: 'cancelled' },
        },
        _sum: { totalAmount: true },
      }),
    ]);

    await prisma.rider.update({
      where: { id: riderId },
      data: {
        totalDeliveries: deliveries,
        totalCashCollected: cashCollected._sum.totalAmount || 0,
      },
    });
  }

  static async createOrderEditHistory(data: Prisma.OrderEditHistoryCreateInput) {
    return await prisma.orderEditHistory.create({ data });
  }

  static async getOrderEditHistory(orderId: number) {
    return await prisma.orderEditHistory.findMany({
      where: { orderId },
      orderBy: { editedAt: 'desc' },
    });
  }

  static async getTableAvailability() {
    const occupiedTables = await prisma.order.findMany({
      where: {
        orderType: 'dine_in',
        paymentStatus: 'pending',
        orderStatus: { not: 'cancelled' },
      },
      select: {
        tableNumber: true,
        id: true,
        orderNumber: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get latest order for each table
    const tableMap = new Map();
    occupiedTables.forEach((order) => {
      if (order.tableNumber !== null && !tableMap.has(order.tableNumber)) {
        tableMap.set(order.tableNumber, order);
      }
    });

    return Array.from(tableMap.values());
  }

  static async getNextOrderNumber(date: Date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const orderCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return orderCount + 1;
  }
}