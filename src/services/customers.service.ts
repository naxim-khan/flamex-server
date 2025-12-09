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

  static async searchCustomersByPhone(partialPhone: string, limit: number = 10) {
    if (!partialPhone || partialPhone.trim().length < 1) {
      return [];
    }
    return await CustomersRepository.findCustomersByPartialPhone(partialPhone.trim(), limit);
  }

  static async getCustomerAddresses(customerId: number) {
    const customer = await CustomersRepository.findCustomerById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }
    return await CustomersRepository.getCustomerAddresses(customerId);
  }

  static async createCustomerAddress(customerId: number, data: {
    address: string;
    isDefault?: boolean;
    notes?: string;
  }) {
    const customer = await CustomersRepository.findCustomerById(customerId);
    if (!customer) {
      throw new ApiError(404, 'Customer not found');
    }

    try {
      return await CustomersRepository.createCustomerAddress({
        customerId,
        address: data.address,
        isDefault: data.isDefault,
        notes: data.notes
      });
    } catch (error: any) {
      if (error.message === 'Address already exists for this customer') {
        throw new ApiError(400, 'Address already exists for this customer');
      }
      throw error;
    }
  }

  static async updateCustomerAddress(addressId: number, data: {
    address?: string;
    isDefault?: boolean;
    notes?: string;
  }) {
    try {
      return await CustomersRepository.updateCustomerAddress(addressId, data);
    } catch (error: any) {
      if (error.message === 'Address not found') {
        throw new ApiError(404, 'Address not found');
      }
      if (error.message === 'Address already exists for this customer') {
        throw new ApiError(400, 'Address already exists for this customer');
      }
      throw error;
    }
  }

  static async deleteCustomerAddress(addressId: number) {
    const address = await CustomersRepository.findCustomerAddressById(addressId);
    if (!address) {
      throw new ApiError(404, 'Address not found');
    }
    return await CustomersRepository.deleteCustomerAddress(addressId);
  }

  static async findOrCreateCustomerByPhone(phone: string, customerData?: {
    name?: string;
    address?: string;
    backupPhone?: string;
    notes?: string;
  }) {
    // Try to find existing customer
    let customer = await CustomersRepository.findCustomerByPhone(phone);

    if (!customer) {
      // Create new customer
      if (!customerData?.name) {
        throw new ApiError(400, 'Customer name is required when creating a new customer');
      }
      if (!customerData?.address) {
        throw new ApiError(400, 'Address is required when creating a new customer');
      }

      const newCustomer = await CustomersRepository.createCustomer({
        name: customerData.name,
        phone: phone.trim(),
        backupPhone: customerData.backupPhone,
        address: customerData.address, // Legacy field
        notes: customerData.notes
      });

      if (!newCustomer) {
        throw new ApiError(500, 'Failed to create customer');
      }

      // Create the first address in the addresses table
      if (customerData.address) {
        await CustomersRepository.createCustomerAddress({
          customerId: newCustomer.id,
          address: customerData.address,
          isDefault: true,
          notes: customerData.notes
        });
      }

      // Fetch customer again with addresses
      customer = await CustomersRepository.findCustomerByPhone(phone);
    }

    return customer;
  }
}