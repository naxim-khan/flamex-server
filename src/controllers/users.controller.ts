// controllers/users.controller.ts
import { Request, Response, NextFunction } from 'express';
import { UsersService } from '../services/users.service';
import ApiResponse from '../common/api-response';
import ApiError from '../common/errors/ApiError';

export class UsersController {
  static async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UsersService.getUsers();
      res.json(ApiResponse.success('Users retrieved successfully', users));
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UsersService.getUserById(parseInt(id));
      res.json(ApiResponse.success('User retrieved successfully', user));
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await UsersService.createUser(req.body);
      res.status(201).json(ApiResponse.success('User created successfully', user));
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.id);

      // Check existence first
      const existingUser = await UsersService.getUserById(userId);
      if (!existingUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      // Validate/update user
      const user = await UsersService.updateUser(userId, req.body);
      res.json(ApiResponse.success('User updated successfully', user));
    } catch (error) {
      next(error);
    }
  }


  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await UsersService.deleteUser(parseInt(id));
      res.json(ApiResponse.success('User deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Authentication required');
      }
      const user = await UsersService.getUserById(req.userId);
      res.json(ApiResponse.success('Profile retrieved successfully', user));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Authentication required');
      }
      const user = await UsersService.updateUser(req.userId, req.body);
      res.json(ApiResponse.success('Profile updated successfully', user));
    } catch (error) {
      next(error);
    }
  }

  static async deactivateUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Authentication required');
      }
      await UsersService.deactivateUser(req.userId);
      res.json(ApiResponse.success('User deactivated successfully'));
    } catch (error) {
      next(error);
    }
  }
}