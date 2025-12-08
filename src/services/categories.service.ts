// services/categories.service.ts
import { CategoriesRepository } from '../repositories/categories.repository';
import ApiError from '../common/errors/ApiError';

export class CategoriesService {
  static async getCategories() {
    return await CategoriesRepository.findCategories();
  }

  static async getCategoryById(id: number) {
    const category = await CategoriesRepository.findCategoryById(id);
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }
    return category;
  }

  static async createCategory(data: { name: string; description?: string }) {
    const existingCategory = await CategoriesRepository.findCategoryByName(data.name);
    if (existingCategory) {
      throw new ApiError(400, 'Category with this name already exists');
    }
    return await CategoriesRepository.createCategory(data);
  }

  static async updateCategory(id: number, data: { name?: string; description?: string }) {
    const existingCategory = await CategoriesRepository.findCategoryById(id);
    if (!existingCategory) {
      throw new ApiError(404, 'Category not found');
    }

    if (data.name && data.name !== existingCategory.name) {
      const categoryWithName = await CategoriesRepository.findCategoryByName(data.name);
      if (categoryWithName) {
        throw new ApiError(400, 'Category with this name already exists');
      }
    }

    return await CategoriesRepository.updateCategory(id, data);
  }

  static async deleteCategory(id: number) {
    const existingCategory = await CategoriesRepository.findCategoryById(id);
    if (!existingCategory) {
      throw new ApiError(404, 'Category not found');
    }

    // Check if category has menu items
    const hasMenuItems = await CategoriesRepository.hasMenuItems(id);
    if (hasMenuItems) {
      throw new ApiError(400, 'Cannot delete category with existing menu items');
    }

    return await CategoriesRepository.deleteCategory(id);
  }
}