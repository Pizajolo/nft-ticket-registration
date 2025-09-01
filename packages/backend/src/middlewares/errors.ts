import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponse } from '../types';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  
  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  
  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error implements AppError {
  statusCode = 429;
  isOperational = true;
  
  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export const errorHandler = (
  error: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    };
    return res.status(400).json(response);
  }

  // Handle known application errors
  if ('statusCode' in error && error.statusCode) {
    const response: ApiResponse = {
      success: false,
      error: error.name,
      message: error.message
    };
    return res.status(error.statusCode).json(response);
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token',
      message: 'The provided token is invalid'
    };
    return res.status(401).json(response);
  }

  if (error.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      error: 'Token expired',
      message: 'The provided token has expired'
    };
    return res.status(401).json(response);
  }

  // Default error response
  const response: ApiResponse = {
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : error.message
  };

  res.status(500).json(response);
};
