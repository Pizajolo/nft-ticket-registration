import { Request, Response, NextFunction } from 'express';
import { env } from '../env';
import { ValidationError } from './errors';

export const csrfProtection = (req: Request, _res: Response, next: NextFunction) => {
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF check for health check endpoint
  if (req.path === '/healthz') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'] as string;
  const csrfCookie = req.cookies[env.CSRF_COOKIE_NAME];

  // For development/testing, allow header-only if cookie is missing
  if (env.NODE_ENV === 'development' && !csrfCookie && csrfToken) {
    console.log('⚠️  CSRF cookie missing in development mode, allowing header-only');
    return next();
  }

  if (!csrfToken || !csrfCookie) {
    throw new ValidationError('CSRF token missing');
  }

  if (csrfToken !== csrfCookie) {
    throw new ValidationError('CSRF token mismatch');
  }

  next();
};

// Middleware to set CSRF token cookie
export const setCsrfToken = (_req: Request, res: Response, next: NextFunction) => {
  // Generate a new CSRF token
  const token = generateCsrfToken();
  
  // Set the CSRF cookie (not HttpOnly so frontend can read it)
  res.cookie(env.CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/'
  });

  // Add token to response for immediate use
  (res.locals as any)['csrfToken'] = token;
  
  next();
};

// Generate a random CSRF token
function generateCsrfToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
