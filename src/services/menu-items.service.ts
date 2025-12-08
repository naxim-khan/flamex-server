// services/menu-items.service.ts
import { MenuItemsRepository } from '../repositories/menu-items.repository';
import ApiError from '../common/errors/ApiError';

export class MenuItemsService {
  static async getMenuItems(filter?: {
    categoryId?: number;
    available?: boolean;
    search?: string;
  }) {
    return await MenuItemsRepository.findMenuItems(filter);
  }

  static async getMenuItemById(id: number) {
    const menuItem = await MenuItemsRepository.findMenuItemById(id);
    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }
    return menuItem;
  }

  static async createMenuItem(data: {
    name: string;
    description?: string;
    price: number;
    categoryId?: number;
    imageUrl?: string;
    available?: boolean;
  }) {
    return await MenuItemsRepository.createMenuItem(data);
  }

  static async updateMenuItem(id: number, data: {
    name?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    imageUrl?: string;
    available?: boolean;
  }) {
    const existingMenuItem = await MenuItemsRepository.findMenuItemById(id);
    if (!existingMenuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    return await MenuItemsRepository.updateMenuItem(id, data);
  }

  static async deleteMenuItem(id: number) {
    const existingMenuItem = await MenuItemsRepository.findMenuItemById(id);
    if (!existingMenuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    return await MenuItemsRepository.deleteMenuItem(id);
  }

  static async toggleAvailability(id: number) {
    const menuItem = await MenuItemsRepository.findMenuItemById(id);
    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    return await MenuItemsRepository.updateMenuItem(id, {
      available: !menuItem.available,
    });
  }

  static async getMenuItemsByCategory(categoryId: number) {
    return await MenuItemsRepository.findMenuItemsByCategory(categoryId);
  }

  static async getAvailableMenuItems() {
    return await MenuItemsRepository.findAvailableMenuItems();
  }
}