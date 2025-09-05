import { Request, Response, NextFunction } from 'express';
import { env } from '../env';
import { sessionService } from '../services/sessionService';
import { AuthenticationError, AuthorizationError } from './errors';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        wallet: `0x${string}`;
        type: 'user' | 'admin';
        sessionId: string;
      };
    }
  }
}

/**
 * Middleware to require authentication
 * Sets req.user with wallet and session type
 * Automatically cleans up expired sessions during validation
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[env.SESSION_COOKIE_NAME];
    
    if (!token) {
      throw new AuthenticationError('No session cookie found');
    }

    // Verify JWT token
    const payload = sessionService.verifyJWT(token);
    
    // Check if session is still valid in database (this also cleans up expired sessions)
    if (!sessionService.isSessionValid(payload.jti)) {
      throw new AuthenticationError('Session expired or invalid');
    }

    // Set user info on request
    req.user = {
      wallet: payload.sub as `0x${string}`,
      type: payload.typ,
      sessionId: payload.jti
    };

    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      next(error);
    } else {
      // If JWT verification fails, the session is definitely invalid
      next(new AuthenticationError('Invalid session'));
    }
  }
};

/**
 * Middleware to require user authentication (not admin)
 */
export const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    
    if (req.user?.type !== 'user') {
      return next(new AuthorizationError('User authentication required'));
    }
    
    next();
  });
};

/**
 * Middleware to require admin authentication
 */
export const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    
    if (req.user?.type !== 'admin') {
      return next(new AuthorizationError('Admin authentication required'));
    }
    
    next();
  });
};

/**
 * Middleware to optionally authenticate (sets req.user if valid token exists)
 * Automatically cleans up expired sessions during validation
 */
export const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = req.cookies[env.SESSION_COOKIE_NAME];
    
    if (!token) {
      return next(); // No token, continue without user
    }

    // Verify JWT token
    const payload = sessionService.verifyJWT(token);
    
    // Check if session is still valid in database (this also cleans up expired sessions)
    if (!sessionService.isSessionValid(payload.jti)) {
      return next(); // Invalid token, continue without user
    }

    // Set user info on request
    req.user = {
      wallet: payload.sub as `0x${string}`,
      type: payload.typ,
      sessionId: payload.jti
    };

    next();
  } catch (error) {
    // Token is invalid, continue without user
    next();
  }
};

/**
 * Helper function to set session cookie
 */
export const setSessionCookie = (res: Response, jwt: string, ttlSec: number, name: string) => {
  res.cookie(name, jwt, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    maxAge: ttlSec * 1000,
    path: '/'
  });
};

/**
 * Helper function to clear session cookie
 */
export const clearSessionCookie = (res: Response, name: string) => {
  res.clearCookie(name, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production'
  });
};
