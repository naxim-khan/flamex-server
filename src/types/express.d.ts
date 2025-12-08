import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: number;
      username?: string;
      role?: string;
      fullName?: string;
    }
  }
}

// This ensures the file is treated as a module
export {};