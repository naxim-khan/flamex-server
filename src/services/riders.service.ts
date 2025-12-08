// services/riders.service.ts
import { RidersRepository } from '../repositories/riders.repository';
import ApiError from '../common/errors/ApiError';

export class RidersService {
  static async getRiders(filter?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: 'active' | 'inactive';
  }) {
    return await RidersRepository.findRiders(filter);
  }

  static async getRiderById(id: number) {
    const rider = await RidersRepository.findRiderById(id);
    if (!rider) {
      throw new ApiError(404, 'Rider not found');
    }
    return rider;
  }

  static async createRider(data: {
    name: string;
    phone: string;
    address?: string;
    cnic?: string;
  }) {
    // Check if phone already exists
    const existingRider = await RidersRepository.findRiderByPhone(data.phone);
    if (existingRider) {
      throw new ApiError(400, 'Rider with this phone number already exists');
    }

    // Check if CNIC exists
    if (data.cnic) {
      const existingCNIC = await RidersRepository.findRiderByCNIC(data.cnic);
      if (existingCNIC) {
        throw new ApiError(400, 'Rider with this CNIC already exists');
      }
    }

    return await RidersRepository.createRider({
      ...data,
      status: 'active',
    });
  }

  static async updateRider(id: number, data: {
    name?: string;
    phone?: string;
    address?: string;
    cnic?: string;
    status?: 'active' | 'inactive';
  }) {
    const existingRider = await RidersRepository.findRiderById(id);
    if (!existingRider) {
      throw new ApiError(404, 'Rider not found');
    }

    // If phone is being updated
    if (data.phone && data.phone !== existingRider.phone) {
      const riderWithPhone = await RidersRepository.findRiderByPhone(data.phone);
      if (riderWithPhone && riderWithPhone.id !== id) {
        throw new ApiError(400, 'Phone number already belongs to another rider');
      }
    }

    // If CNIC is being updated
    if (data.cnic && data.cnic !== existingRider.cnic) {
      const riderWithCNIC = await RidersRepository.findRiderByCNIC(data.cnic);
      if (riderWithCNIC && riderWithCNIC.id !== id) {
        throw new ApiError(400, 'CNIC already belongs to another rider');
      }
    }

    return await RidersRepository.updateRider(id, data);
  }

  static async deleteRider(id: number) {
    const existingRider = await RidersRepository.findRiderById(id);
    if (!existingRider) {
      throw new ApiError(404, 'Rider not found');
    }

    // Check if rider has assigned orders
    const hasOrders = await RidersRepository.hasAssignedOrders(id);
    if (hasOrders) {
      throw new ApiError(400, 'Cannot delete rider with assigned orders');
    }

    return await RidersRepository.deleteRider(id);
  }

  static async toggleRiderStatus(id: number) {
    const rider = await RidersRepository.findRiderById(id);
    if (!rider) {
      throw new ApiError(404, 'Rider not found');
    }

    const newStatus = rider.status === 'active' ? 'inactive' : 'active';
    return await RidersRepository.updateRider(id, { status: newStatus });
  }

  static async getRiderOrders(riderId: number, pagination?: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const rider = await RidersRepository.findRiderById(riderId);
    if (!rider) {
      throw new ApiError(404, 'Rider not found');
    }

    return await RidersRepository.getRiderOrders(riderId, pagination);
  }

  static async getActiveRiders() {
    return await RidersRepository.findActiveRiders();
  }

  static async getRiderByPhone(phone: string) {
    const rider = await RidersRepository.findRiderByPhone(phone);
    if (!rider) {
      throw new ApiError(404, 'Rider not found');
    }
    return rider;
  }
}