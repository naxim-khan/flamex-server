import bcrypt from 'bcryptjs';
import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import config from '../config/config';
import { UsersRepository } from '../repositories/users.repository';
import ApiError from '../common/errors/ApiError';
import { LoginInput, RegisterInput } from '../types';

interface AccessTokenPayload extends JwtPayload {
  userId: number;
  username: string;
  role: string;
}

interface RefreshTokenPayload extends JwtPayload {
  userId: number;
}

export class AuthService {
  static async login(data: LoginInput) {
    const { username, password } = data;

    const user = await UsersRepository.findUserByUsername(username);
    if (!user) throw new ApiError(401, 'Invalid credentials');

    if (user.status !== 'active')
      throw new ApiError(401, 'Account is inactive');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
      } as AccessTokenPayload,
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRES_IN } as SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id } as RefreshTokenPayload,
      config.JWT_REFRESH_SECRET as string,
      { expiresIn: config.JWT_REFRESH_EXPIRES_IN } as SignOptions
    );

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async register(data: RegisterInput) {
    const { username, password, fullName, role, email, phone } = data;

    const existingUser = await UsersRepository.findUserByUsername(username);
    if (existingUser) throw new ApiError(400, 'Username already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await UsersRepository.createUser({
      username,
      password: hashedPassword,
      fullName,
      role,
      email,
      phone,
      status: 'active',
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        config.JWT_REFRESH_SECRET as string
      ) as RefreshTokenPayload;

      if (!decoded?.userId) throw new ApiError(401, 'Invalid refresh token');

      const user = await UsersRepository.findUserById(decoded.userId);
      if (!user || user.status !== 'active')
        throw new ApiError(401, 'Invalid refresh token');

      const accessToken = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
        } as AccessTokenPayload,
        config.JWT_SECRET as string,
        { expiresIn: config.JWT_EXPIRES_IN } as SignOptions
      );

      return { accessToken };
    } catch {
      throw new ApiError(401, 'Invalid refresh token');
    }
  }

  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ) {
    const user = await UsersRepository.findUserById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const fullUser = await UsersRepository.findUserByUsername(user.username);
    if (!fullUser) throw new ApiError(404, 'User not found');

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      fullUser.password
    );
    if (!isPasswordValid)
      throw new ApiError(400, 'Current password is incorrect');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await UsersRepository.updateUser(userId, { password: hashedPassword });

    return { message: 'Password changed successfully' };
  }

  static async logout() {
    return { message: 'Logged out successfully' };
  }

  static async getCurrentUser(userId: number) {
    const user = await UsersRepository.findUserById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }
}