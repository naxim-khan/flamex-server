// repositories/riders.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class RidersRepository {
  static async findRiders(filter?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }) {
    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.RiderWhereInput = {};

    if (filter?.status) {
      where.status = filter.status;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
        { cnic: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [riders, total] = await Promise.all([
      prisma.rider.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.rider.count({ where }),
    ]);

    return {
      riders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findRiderById(id: number) {
    return await prisma.rider.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });
  }

  static async findRiderByPhone(phone: string) {
    return await prisma.rider.findUnique({
      where: { phone },
    });
  }

  static async findRiderByCNIC(cnic: string) {
    return await prisma.rider.findUnique({
      where: { cnic },
    });
  }

  static async createRider(data: Prisma.RiderCreateInput) {
    return await prisma.rider.create({ data });
  }

  static async updateRider(id: number, data: Prisma.RiderUpdateInput) {
    return await prisma.rider.update({
      where: { id },
      data,
    });
  }

  static async deleteRider(id: number) {
    return await prisma.rider.delete({
      where: { id },
    });
  }

  static async hasAssignedOrders(id: number) {
    const count = await prisma.order.count({
      where: { riderId: id },
    });
    return count > 0;
  }

  static async getRiderOrders(riderId: number, pagination?: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      riderId,
      orderStatus: { not: 'cancelled' },
    };

    if (pagination?.status) {
      if (pagination.status === 'delivered') {
        where.deliveryStatus = 'delivered';
      } else if (pagination.status === 'pending') {
        where.deliveryStatus = { not: 'delivered' };
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: true,
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

    return {
      orders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findActiveRiders() {
    return await prisma.rider.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
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
}