import { Request, Response, NextFunction } from 'express';
import ApiError from '../common/errors/ApiError';
import logger from '../config/logger';

export const errorHandler = (
  error: Error,
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
  } else if (error.name === 'PrismaClientKnownRequestError') {
    statusCode = 400;
    message = 'Database error occurred';
    
    // Handle specific Prisma errors
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      const target = prismaError.meta?.target || [];
      message = `Duplicate entry: ${Array.isArray(target) ? target.join(', ') : target} already exists`;
      errors = [prismaError.meta];
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    } else if (prismaError.code === 'P2003') {
      statusCode = 400;
      message = 'Foreign key constraint failed';
      errors = [{ field: prismaError.meta?.field_name, message: 'Referenced record does not exist' }];
    }
  } else if (error.name === 'ZodError') {
    statusCode = 400;
    message = 'Validation failed';
    const zodError = error as any;
    errors = zodError.issues?.map((issue: any) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    })) || zodError.errors;
  } else if (error.name === 'PrismaClientValidationError') {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Log error with request context
  logger.error(
    `[${statusCode}] ${message} - ${req.method} ${req.originalUrl} - IP: ${req.ip}`,
    {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      body: req.body,
      params: req.params,
      query: req.query
    }
  );

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};