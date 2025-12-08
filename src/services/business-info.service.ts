// services/business-info.service.ts
import { BusinessInfoRepository } from '../repositories/business-info.repository';
import ApiError from '../common/errors/ApiError';

export class BusinessInfoService {
  static async getAllBusinessInfo() {
    return await BusinessInfoRepository.findAll();
  }

  static async getBusinessInfoByKey(key: string) {
    const businessInfo = await BusinessInfoRepository.findByKey(key);
    if (!businessInfo) {
      throw new ApiError(404, 'Business info not found');
    }
    return businessInfo;
  }

  static async createBusinessInfo(data: { key: string; value: string }) {
    const existingInfo = await BusinessInfoRepository.findByKey(data.key);
    if (existingInfo) {
      throw new ApiError(400, `Business info with key '${data.key}' already exists`);
    }

    return await BusinessInfoRepository.create(data);
  }

  static async updateBusinessInfo(key: string, data: { value: string }) {
    const existingInfo = await BusinessInfoRepository.findByKey(key);
    if (!existingInfo) {
      throw new ApiError(404, 'Business info not found');
    }

    return await BusinessInfoRepository.update(key, data);
  }

  static async deleteBusinessInfo(key: string) {
    const existingInfo = await BusinessInfoRepository.findByKey(key);
    if (!existingInfo) {
      throw new ApiError(404, 'Business info not found');
    }

    // Prevent deletion of critical system settings
    const criticalKeys = ['business_name', 'business_address', 'business_phone'];
    if (criticalKeys.includes(key)) {
      throw new ApiError(400, 'Cannot delete critical business info');
    }

    return await BusinessInfoRepository.delete(key);
  }

  static async getAllSettings() {
    const settings = await BusinessInfoRepository.findAll();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>);
  }

  static async upsertSetting(key: string, value: string) {
    return await BusinessInfoRepository.upsert(key, value);
  }
}