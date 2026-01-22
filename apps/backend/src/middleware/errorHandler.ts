import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, { statusCode: err.statusCode, data: err.data });
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data }),
    });
  } else {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : err.message,
    });
  }
};
