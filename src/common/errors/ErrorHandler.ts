import { Request, Response, NextFunction } from 'express';
import ApiError from './ApiError';
import logger from '../../config/logger';

class ErrorHandler {
  static handle = () => {
    return (
      error: Error | ApiError,
      req: Request,
      res: Response,
      next: NextFunction,
    ) => {
      let statusCode = 500;
      let message = 'Internal Server Error';
      let errors: any[] | undefined;

      if (error instanceof ApiError) {
        statusCode = error.statusCode;
        message = error.message;
        errors = error.errors;
      } else if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
      } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
      } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
      } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Not Found';
      }

      // Log error
      logger.error(
        `${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
      );

      if (process.env.NODE_ENV === 'development') {
        logger.error(error.stack);
      }

      res.status(statusCode).json({
        success: false,
        message,
        errors,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      });
    };
  };

  static notFound = (req: Request, res: Response, next: NextFunction) => {
    const error = new ApiError(404, `Route ${req.originalUrl} not found`);
    next(error);
  };
}

export default ErrorHandler;