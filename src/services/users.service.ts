// services/users.service.ts
import bcrypt from 'bcryptjs';
import { UsersRepository } from '../repositories/users.repository';
import ApiError from '../common/errors/ApiError';

export class UsersService {
  static async getUsers() {
    return await UsersRepository.findUsers();
  }

  static async getUserById(id: number) {
    const user = await UsersRepository.findUserById(id);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return user;
  }

  static async createUser(data: {
    username: string;
    password: string;
    fullName: string;
    role: 'admin' | 'manager';
    email?: string;
    phone?: string;
  }) {
    const existingUser = await UsersRepository.findUserByUsername(data.username);
    if (existingUser) {
      throw new ApiError(400, 'Username already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    return await UsersRepository.createUser({
      ...data,
      password: hashedPassword,
      status: 'active',
    });
  }

  static async updateUser(id: number, data: {
    fullName?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: 'admin' | 'manager';
    status?: 'active' | 'inactive';
  }) {
    const existingUser = await UsersRepository.findUserById(id);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    const updateData: any = { ...data };
    
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await UsersRepository.updateUser(id, updateData);
  }

  static async deleteUser(id: number) {
    const existingUser = await UsersRepository.findUserById(id);
    if (!existingUser) {
      throw new ApiError(404, 'User not found');
    }

    // Check if it's the last admin
    if (existingUser.role === 'admin') {
      const adminCount = await UsersRepository.countAdmins();
      if (adminCount <= 1) {
        throw new ApiError(400, 'Cannot delete the last admin user');
      }
    }

    return await UsersRepository.deleteUser(id);
  }

  static async deactivateUser(id: number) {
    return await UsersRepository.updateUser(id, { status: 'inactive' });
  }
}