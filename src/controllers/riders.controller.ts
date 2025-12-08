// controllers/riders.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RidersService } from '../services/riders.service';
import ApiResponse from '../common/api-response';

export class RidersController {
  static async getRiders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50', search, status } = req.query;
      const riders = await RidersService.getRiders({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
        status: status as 'active' | 'inactive',
      });
      res.json(ApiResponse.success('Riders retrieved successfully', riders));
    } catch (error) {
      next(error);
    }
  }

  static async getRider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rider = await RidersService.getRiderById(parseInt(id));
      res.json(ApiResponse.success('Rider retrieved successfully', rider));
    } catch (error) {
      next(error);
    }
  }

  static async createRider(req: Request, res: Response, next: NextFunction) {
    try {
      const rider = await RidersService.createRider(req.body);
      res.status(201).json(ApiResponse.success('Rider created successfully', rider));
    } catch (error) {
      next(error);
    }
  }

  static async updateRider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rider = await RidersService.updateRider(parseInt(id), req.body);
      res.json(ApiResponse.success('Rider updated successfully', rider));
    } catch (error) {
      next(error);
    }
  }

  static async deleteRider(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await RidersService.deleteRider(parseInt(id));
      res.json(ApiResponse.success('Rider deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async toggleRiderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const rider = await RidersService.toggleRiderStatus(parseInt(id));
      res.json(ApiResponse.success('Rider status toggled successfully', rider));
    } catch (error) {
      next(error);
    }
  }

  static async getRiderOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit = '10', page = '1', status } = req.query;
      const orders = await RidersService.getRiderOrders(parseInt(id), {
        limit: parseInt(limit as string),
        page: parseInt(page as string),
        status: status as string,
      });
      res.json(ApiResponse.success('Rider orders retrieved successfully', orders));
    } catch (error) {
      next(error);
    }
  }

  static async getActiveRiders(req: Request, res: Response, next: NextFunction) {
    try {
      const riders = await RidersService.getActiveRiders();
      res.json(ApiResponse.success('Active riders retrieved successfully', riders));
    } catch (error) {
      next(error);
    }
  }

  static async getRiderByPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.params;
      const rider = await RidersService.getRiderByPhone(phone);
      res.json(ApiResponse.success('Rider retrieved successfully', rider));
    } catch (error) {
      next(error);
    }
  }
}