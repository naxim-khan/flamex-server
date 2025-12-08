import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import ApiResponse from '../common/api-response';
import ApiError from '../common/errors/ApiError';

export class AuthController {
  // Login endpoint
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);

      // Set access token cookie (7 days)
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // false for local dev
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        path: '/',
      });

      // Set refresh token cookie (30 days)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // false for local dev
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
        path: '/',
      });

      // Return only user info, NOT tokens
      res.json(ApiResponse.success('Login successful', {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }));
    } catch (error) {
      next(error);
    }
  }

  // Register endpoint
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.register(req.body);
      res.status(201).json(ApiResponse.success('User registered successfully', user));
    } catch (error) {
      next(error);
    }
  }

  // Refresh token endpoint
  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        throw new ApiError(401, 'Refresh token not found');
      }

      const result = await AuthService.refreshToken(refreshToken);

      // Set new access token cookie
      res.cookie('token', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json(ApiResponse.success('Token refreshed successfully'));
    } catch (error) {
      next(error);
    }
  }

  // Change password endpoint
  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const { currentPassword, newPassword } = req.body;
      const result = await AuthService.changePassword(
        req.userId,
        currentPassword,
        newPassword,
      );
      res.json(ApiResponse.success('Password changed successfully', result));
    } catch (error) {
      next(error);
    }
  }

  // Logout endpoint
  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Clear cookies
      res.clearCookie('token', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });

      const result = await AuthService.logout();
      res.json(ApiResponse.success('Logged out successfully', result));
    } catch (error) {
      next(error);
    }
  }

  // Get current user endpoint
  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new ApiError(401, 'Authentication required');
      }

      const user = await AuthService.getCurrentUser(req.userId);
      res.json(ApiResponse.success('User retrieved successfully', user));
    } catch (error) {
      next(error);
    }
  }
}