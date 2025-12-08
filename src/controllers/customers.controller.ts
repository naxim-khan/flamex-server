// controllers/customers.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CustomersService } from '../services/customers.service';
import ApiResponse from '../common/api-response';

export class CustomersController {
  static async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = '1', limit = '50', search } = req.query;
      const customers = await CustomersService.getCustomers({
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        search: search as string,
      });
      res.json(ApiResponse.success('Customers retrieved successfully', customers));
    } catch (error) {
      next(error);
    }
  }

  static async getCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await CustomersService.getCustomerById(parseInt(id));
      res.json(ApiResponse.success('Customer retrieved successfully', customer));
    } catch (error) {
      next(error);
    }
  }

  static async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await CustomersService.createCustomer(req.body);
      res.status(201).json(ApiResponse.success('Customer created successfully', customer));
    } catch (error) {
      next(error);
    }
  }

  static async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const customer = await CustomersService.updateCustomer(parseInt(id), req.body);
      res.json(ApiResponse.success('Customer updated successfully', customer));
    } catch (error) {
      next(error);
    }
  }

  static async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await CustomersService.deleteCustomer(parseInt(id));
      res.json(ApiResponse.success('Customer deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { limit = '10', page = '1' } = req.query;
      const orders = await CustomersService.getCustomerOrders(parseInt(id), {
        limit: parseInt(limit as string),
        page: parseInt(page as string),
      });
      res.json(ApiResponse.success('Customer orders retrieved successfully', orders));
    } catch (error) {
      next(error);
    }
  }

  static async searchCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query; // q can be phone, name, or address
      if (!q || (q as string).trim().length < 2) {
        return res.status(400).json(ApiResponse.error('Search query must be at least 2 characters'));
      }
      const customers = await CustomersService.searchCustomers((q as string).trim());
      return res.json(ApiResponse.success('Customers retrieved successfully', customers));
    } catch (error) {
      return next(error);
    }
  }

  static async getCustomerByPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.params;
      const customer = await CustomersService.getCustomerByPhone(phone);
      res.json(ApiResponse.success('Customer retrieved successfully', customer));
    } catch (error) {
      next(error);
    }
  }

  static async searchCustomersByPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;
      const limit = parseInt((req.query.limit as string) || '10');
      
      if (!q || (q as string).trim().length < 1) {
        return res.json(ApiResponse.success('Customers retrieved successfully', []));
      }

      const customers = await CustomersService.searchCustomersByPhone((q as string).trim(), limit);
      return res.json(ApiResponse.success('Customers retrieved successfully', customers));
    } catch (error) {
      return next(error);
    }
  }

  static async getCustomerAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const addresses = await CustomersService.getCustomerAddresses(parseInt(id));
      return res.json(ApiResponse.success('Customer addresses retrieved successfully', addresses));
    } catch (error) {
      return next(error);
    }
  }

  static async createCustomerAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { address, isDefault, notes } = req.body;

      if (!address || !address.trim()) {
        return res.status(400).json(ApiResponse.error('Address is required'));
      }

      const newAddress = await CustomersService.createCustomerAddress(parseInt(id), {
        address,
        isDefault,
        notes
      });

      return res.status(201).json(ApiResponse.success('Address created successfully', newAddress));
    } catch (error) {
      return next(error);
    }
  }

  static async updateCustomerAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { addressId } = req.params;
      const { address, isDefault, notes } = req.body;

      const updatedAddress = await CustomersService.updateCustomerAddress(parseInt(addressId), {
        address,
        isDefault,
        notes
      });

      return res.json(ApiResponse.success('Address updated successfully', updatedAddress));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteCustomerAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const { addressId } = req.params;
      await CustomersService.deleteCustomerAddress(parseInt(addressId));
      return res.json(ApiResponse.success('Address deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }

  static async findOrCreateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, name, address, backupPhone, notes } = req.body;

      if (!phone || !phone.trim()) {
        return res.status(400).json(ApiResponse.error('Phone number is required'));
      }

      const customer = await CustomersService.findOrCreateCustomerByPhone(phone.trim(), {
        name,
        address,
        backupPhone,
        notes
      });

      return res.json(ApiResponse.success('Customer retrieved or created successfully', customer));
    } catch (error) {
      return next(error);
    }
  }
}