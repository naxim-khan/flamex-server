// repositories/customers.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class CustomersRepository {
  static async findCustomers(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    const page = filter?.page || 1;
    const limit = filter?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {};

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
        { backupPhone: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          addresses: {
            orderBy: [
              { isDefault: 'desc' },
              { createdAt: 'asc' }
            ],
            take: 1 // Only get first/default address for list view
          }
        }
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async findCustomerById(id: number) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      },
    });
  }

  static async searchCustomers(query: string) {
    // Search by phone, name, or address
    const where: Prisma.CustomerWhereInput = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { backupPhone: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        {
          addresses: {
            some: {
              address: { contains: query, mode: 'insensitive' }
            }
          }
        }
      ],
    };

    return await prisma.customer.findMany({
      where,
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ],
          take: 1 // Only get first address for search results
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit results
    });
  }

  static async findCustomerByPhone(phone: string) {
    return await prisma.customer.findUnique({
      where: { phone },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ]
        }
      }
    });
  }

  static async findCustomersByPartialPhone(partialPhone: string, limit: number = 10) {
    return await prisma.customer.findMany({
      where: {
        OR: [
          { phone: { contains: partialPhone, mode: 'insensitive' } },
          { backupPhone: { contains: partialPhone, mode: 'insensitive' } }
        ]
      },
      include: {
        addresses: {
          orderBy: [
            { isDefault: 'desc' },
            { createdAt: 'asc' }
          ],
          take: 1 // Only get first address for search results
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  static async createCustomer(data: Prisma.CustomerCreateInput) {
    return await prisma.customer.create({ data });
  }

  static async updateCustomer(id: number, data: Prisma.CustomerUpdateInput) {
    return await prisma.customer.update({
      where: { id },
      data,
    });
  }

  static async deleteCustomer(id: number) {
    return await prisma.customer.delete({
      where: { id },
    });
  }

  static async hasOrders(id: number) {
    const count = await prisma.order.count({
      where: { customerId: id },
    });
    return count > 0;
  }

  static async getCustomerOrders(customerId: number, pagination?: {
    page: number;
    limit: number;
  }) {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          customerId,
          orderStatus: { not: 'cancelled' },
        },
        include: {
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
      prisma.order.count({
        where: { customerId },
      }),
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

  // Customer Address methods
  static async getCustomerAddresses(customerId: number) {
    return await prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ]
    });
  }

  static async findCustomerAddressById(addressId: number) {
    return await prisma.customerAddress.findUnique({
      where: { id: addressId }
    });
  }

  static async createCustomerAddress(data: {
    customerId: number;
    address: string;
    isDefault?: boolean;
    notes?: string;
  }) {
    // Check if address already exists for this customer (case-insensitive)
    const existingAddresses = await prisma.customerAddress.findMany({
      where: { customerId: data.customerId }
    });

    const normalizedNewAddress = data.address.trim().toLowerCase();
    const duplicate = existingAddresses.find(
      addr => addr.address.trim().toLowerCase() === normalizedNewAddress
    );

    if (duplicate) {
      throw new Error('Address already exists for this customer');
    }

    // If this is set as default, unset other defaults
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: { customerId: data.customerId, isDefault: true },
        data: { isDefault: false }
      });
    }

    return await prisma.customerAddress.create({
      data: {
        customerId: data.customerId,
        address: data.address.trim(),
        isDefault: data.isDefault || false,
        notes: data.notes
      }
    });
  }

  static async updateCustomerAddress(addressId: number, data: {
    address?: string;
    isDefault?: boolean;
    notes?: string;
  }) {
    const existingAddress = await prisma.customerAddress.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      throw new Error('Address not found');
    }

    // If updating address text, check for duplicates
    if (data.address) {
      const normalizedNewAddress = data.address.trim().toLowerCase();
      const existingAddresses = await prisma.customerAddress.findMany({
        where: {
          customerId: existingAddress.customerId,
          id: { not: addressId }
        }
      });

      const duplicate = existingAddresses.find(
        addr => addr.address.trim().toLowerCase() === normalizedNewAddress
      );

      if (duplicate) {
        throw new Error('Address already exists for this customer');
      }
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await prisma.customerAddress.updateMany({
        where: {
          customerId: existingAddress.customerId,
          id: { not: addressId },
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    return await prisma.customerAddress.update({
      where: { id: addressId },
      data: {
        ...(data.address && { address: data.address.trim() }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.notes !== undefined && { notes: data.notes })
      }
    });
  }

  static async deleteCustomerAddress(addressId: number) {
    return await prisma.customerAddress.delete({
      where: { id: addressId }
    });
  }
}