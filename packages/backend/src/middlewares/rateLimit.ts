import { Request, Response, NextFunction } from 'express';
import { RateLimitError } from './errors';

// Simple in-memory rate limiting (in production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // Max requests per window

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Get current count for this IP
  const current = requestCounts.get(ip);
  
  if (!current || now > current.resetTime) {
    // First request or window expired
    requestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }
  
  if (current.count >= MAX_REQUESTS) {
    // Rate limit exceeded
    const resetTime = new Date(current.resetTime).toISOString();
    res.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', resetTime);
    
    throw new RateLimitError(`Rate limit exceeded. Try again after ${resetTime}`);
  }
  
  // Increment count
  current.count++;
  res.set('X-RateLimit-Limit', MAX_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', (MAX_REQUESTS - current.count).toString());
  res.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
  
  next();
};

// Special rate limiter for authentication endpoints
export const authRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const wallet = req.body?.wallet || 'unknown';
  const key = `${ip}:${wallet}`;
  const now = Date.now();
  
  // Stricter limits for auth endpoints
  const AUTH_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
  const MAX_AUTH_REQUESTS = 10; // Max auth attempts per window
  
  const current = requestCounts.get(key);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + AUTH_WINDOW_MS });
    return next();
  }
  
  if (current.count >= MAX_AUTH_REQUESTS) {
    const resetTime = new Date(current.resetTime).toISOString();
    res.set('X-RateLimit-Limit', MAX_AUTH_REQUESTS.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', resetTime);
    
    throw new RateLimitError(`Too many authentication attempts. Try again after ${resetTime}`);
  }
  
  current.count++;
  res.set('X-RateLimit-Limit', MAX_AUTH_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', (MAX_AUTH_REQUESTS - current.count).toString());
  res.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
  
  next();
};

// Admin rate limiter - much more lenient for admin operations
export const adminRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Very generous limits for admin operations
  const ADMIN_WINDOW_MS = 1 * 60 * 1000; // 15 minutes
  const MAX_ADMIN_REQUESTS = 500; // Max requests per window (much higher)
  
  const current = requestCounts.get(`admin:${ip}`);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(`admin:${ip}`, { count: 1, resetTime: now + ADMIN_WINDOW_MS });
    return next();
  }
  
  if (current.count >= MAX_ADMIN_REQUESTS) {
    const resetTime = new Date(current.resetTime).toISOString();
    res.set('X-RateLimit-Limit', MAX_ADMIN_REQUESTS.toString());
    res.set('X-RateLimit-Remaining', '0');
    res.set('X-RateLimit-Reset', resetTime);
    
    throw new RateLimitError(`Admin rate limit exceeded. Try again after ${resetTime}`);
  }
  
  current.count++;
  res.set('X-RateLimit-Limit', MAX_ADMIN_REQUESTS.toString());
  res.set('X-RateLimit-Remaining', (MAX_ADMIN_REQUESTS - current.count).toString());
  res.set('X-RateLimit-Reset', new Date(current.resetTime).toISOString());
  
  next();
};

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, WINDOW_MS);
