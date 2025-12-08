// repositories/categories.repository.ts
import { Prisma } from '../generated/prisma/client';
import prisma from '../prismaClient';

export class CategoriesRepository {
  static async findCategories() {
    return await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  static async findCategoryById(id: number) {
    return await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });
  }

  static async findCategoryByName(name: string) {
    return await prisma.category.findUnique({
      where: { name },
    });
  }

  static async createCategory(data: Prisma.CategoryCreateInput) {
    return await prisma.category.create({ data });
  }

  static async updateCategory(id: number, data: Prisma.CategoryUpdateInput) {
    return await prisma.category.update({
      where: { id },
      data,
    });
  }

  static async deleteCategory(id: number) {
    return await prisma.category.delete({
      where: { id },
    });
  }

  static async hasMenuItems(id: number) {
    const count = await prisma.menuItem.count({
      where: { categoryId: id },
    });
    return count > 0;
  }
}