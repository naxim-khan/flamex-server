// services/customers.service.ts
import { CustomersRepository } from '../repositories/customers.repository';
import ApiError from '../common/errors/ApiError';

export class CustomersService {
  static async getCustomers(filter?: {
    page?: number;
    limit?: number;
    search?: string;
  }) {
    return await CustomersRepository.findCustomers(filter);
  }

  static async getCustomerById(id: number) {
    const customer = await CustomersRepository.findCustomerById(id);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
    return customer;
  }

  static async createCustomer(data: {
    name: string;
    phone: string;
    backupPhone?: string;
    address: string;
    notes?: string;
  }) {
    // Check if phone already exists
    const existingCustomer = await CustomersRepository.findCustomerByPhone(data.phone);
    if (existingCustomer) {
      throw new ApiError(400, 'Customer with this phone number already exists');
    }

    return await CustomersRepository.createCustomer(data);
  }

  static async updateCustomer(id: number, data: {
    name?: string;
    phone?: string;
    backupPhone?: string;
    address?: string;
    notes?: string;
  }) {
    const existingCustomer = await CustomersRepository.findCustomerById(id);
    if (!existingCustomer) {
      throw new ApiError(404, 'Customer not found');
    }

    // If phone is being updated, check if new phone exists
    if (data.phone && data.phone !== existingCustomer.phone) {
      const customerWithPhone = await CustomersRepository.findCustomerByPhone(data.phone);
      if (customerWithPhone && customerWithPhone.id !== id) {
        throw new ApiError(400, 'Phone number already belongs to another customer');
      }
    }

    return await CustomersRepository.updateCustomer(id, data);
  }

  static async deleteCustomer(id: number) {
    const existingCustomer = await CustomersRepository.findCustomerById(id);
    if (!existingCustomer) {
      throw new ApiError(404, 'Customer not found');
    }

    // Check if customer has orders
    const hasOrders = await CustomersRepository.hasOrders(id);
    if (hasOrders) {
      throw new ApiError(400, 'Cannot delete customer with existing orders');
    }

    return await CustomersRepository.deleteCustomer(id);
  }

  static async getCustomerOrders(customerId: number, pagination?: {
    page: number;
    limit: number;
  }) {
    const customer = await CustomersRepository.findCustomerById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    return await CustomersRepository.getCustomerOrders(customerId, pagination);
  }

  static async searchCustomers(query: string) {
    return await CustomersRepository.searchCustomers(query);
  }

  static async getCustomerByPhone(phone: string) {
    const customer = await CustomersRepository.findCustomerByPhone(phone);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
    return customer;
  }
}