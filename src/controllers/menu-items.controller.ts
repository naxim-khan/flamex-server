// controllers/menu-items.controller.ts
import { Request, Response, NextFunction } from 'express';
import { MenuItemsService } from '../services/menu-items.service';
import ApiResponse from '../common/api-response';

export class MenuItemsController {
  static async getMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId, available, search } = req.query;
      const menuItems = await MenuItemsService.getMenuItems({
        categoryId: categoryId ? parseInt(categoryId as string) : undefined,
        available: available === 'true' ? true : available === 'false' ? false : undefined,
        search: search as string,
      });
      res.json(ApiResponse.success('Menu items retrieved successfully', menuItems));
    } catch (error) {
      next(error);
    }
  }

  static async getMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const menuItem = await MenuItemsService.getMenuItemById(parseInt(id));
      res.json(ApiResponse.success('Menu item retrieved successfully', menuItem));
    } catch (error) {
      next(error);
    }
  }

  static async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const menuItem = await MenuItemsService.createMenuItem(req.body);
      res.status(201).json(ApiResponse.success('Menu item created successfully', menuItem));
    } catch (error) {
      next(error);
    }
  }

  static async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const menuItem = await MenuItemsService.updateMenuItem(parseInt(id), req.body);
      res.json(ApiResponse.success('Menu item updated successfully', menuItem));
    } catch (error) {
      next(error);
    }
  }

  static async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await MenuItemsService.deleteMenuItem(parseInt(id));
      res.json(ApiResponse.success('Menu item deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const menuItem = await MenuItemsService.toggleAvailability(parseInt(id));
      res.json(ApiResponse.success('Menu item availability toggled successfully', menuItem));
    } catch (error) {
      next(error);
    }
  }

  static async getMenuItemsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { categoryId } = req.params;
      const menuItems = await MenuItemsService.getMenuItemsByCategory(parseInt(categoryId));
      res.json(ApiResponse.success('Menu items retrieved successfully', menuItems));
    } catch (error) {
      next(error);
    }
  }

  static async getAvailableMenuItems(req: Request, res: Response, next: NextFunction) {
    try {
      const menuItems = await MenuItemsService.getAvailableMenuItems();
      res.json(ApiResponse.success('Available menu items retrieved successfully', menuItems));
    } catch (error) {
      next(error);
    }
  }
}