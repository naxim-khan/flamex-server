// controllers/business-info.controller.ts
import { Request, Response, NextFunction } from 'express';
import { BusinessInfoService } from '../services/business-info.service';
import ApiResponse from '../common/api-response';

export class BusinessInfoController {
  static async getAllBusinessInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const businessInfo = await BusinessInfoService.getAllBusinessInfo();
      res.json(ApiResponse.success('Business info retrieved successfully', businessInfo));
    } catch (error) {
      next(error);
    }
  }

  static async getBusinessInfoByKey(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const businessInfo = await BusinessInfoService.getBusinessInfoByKey(key);
      res.json(ApiResponse.success('Business info retrieved successfully', businessInfo));
    } catch (error) {
      next(error);
    }
  }

  static async createBusinessInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const businessInfo = await BusinessInfoService.createBusinessInfo(req.body);
      res.status(201).json(ApiResponse.success('Business info created successfully', businessInfo));
    } catch (error) {
      next(error);
    }
  }

  static async updateBusinessInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const businessInfo = await BusinessInfoService.updateBusinessInfo(key, req.body);
      res.json(ApiResponse.success('Business info updated successfully', businessInfo));
    } catch (error) {
      next(error);
    }
  }

  static async deleteBusinessInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      await BusinessInfoService.deleteBusinessInfo(key);
      res.json(ApiResponse.success('Business info deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getAllSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await BusinessInfoService.getAllSettings();
      res.json(ApiResponse.success('Settings retrieved successfully', settings));
    } catch (error) {
      next(error);
    }
  }
}