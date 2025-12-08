import { Request, Response, NextFunction } from 'express';

export const debugRoute = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log('=== ROUTE DEBUG ===');
    console.log('Method:', req.method);
    console.log('Original URL:', req.originalUrl);
    console.log('Base URL:', req.baseUrl);
    console.log('Path:', req.path);
    console.log('Params:', req.params);
    console.log('Query:', req.query);
    console.log('==================');
  }
  next();
};
