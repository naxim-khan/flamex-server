// repositories/menu-items.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class MenuItemsRepository {
  static async findMenuItems(filter?: {
    categoryId?: number;
    available?: boolean;
    search?: string;
  }) {
    const where: Prisma.MenuItemWhereInput = {};

    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    if (filter?.available !== undefined) {
      where.available = filter.available;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async findMenuItemById(id: number) {
    return await prisma.menuItem.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  static async findMenuItemsByCategory(categoryId: number) {
    return await prisma.menuItem.findMany({
      where: { categoryId, available: true },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async findAvailableMenuItems() {
    return await prisma.menuItem.findMany({
      where: { available: true },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async createMenuItem(data: Prisma.MenuItemCreateInput) {
    return await prisma.menuItem.create({ data });
  }

  static async updateMenuItem(id: number, data: Prisma.MenuItemUpdateInput) {
    return await prisma.menuItem.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  static async deleteMenuItem(id: number) {
    return await prisma.menuItem.delete({
      where: { id },
    });
  }
}