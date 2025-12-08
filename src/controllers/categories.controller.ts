// controllers/categories.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CategoriesService } from '../services/categories.service';
import ApiResponse from '../common/api-response';

export class CategoriesController {
  static async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await CategoriesService.getCategories();
      res.json(ApiResponse.success('Categories retrieved successfully', categories));
    } catch (error) {
      next(error);
    }
  }

  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoriesService.getCategoryById(parseInt(id));
      res.json(ApiResponse.success('Category retrieved successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const category = await CategoriesService.createCategory(req.body);
      res.status(201).json(ApiResponse.success('Category created successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await CategoriesService.updateCategory(parseInt(id), req.body);
      res.json(ApiResponse.success('Category updated successfully', category));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CategoriesService.deleteCategory(parseInt(id));
      res.json(ApiResponse.success('Category deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}