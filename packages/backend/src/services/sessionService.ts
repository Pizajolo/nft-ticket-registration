import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../env';
import { Session } from '../types';
import { getDatabase, saveDatabase } from '../db/init';

export interface JWTPayload {
  sub: string;           // wallet address
  typ: 'user' | 'admin'; // session type
  jti: string;           // JWT ID (session ID)
  iat: number;           // issued at
  exp: number;           // expiration
}

export interface SessionData {
  wallet: `0x${string}`;
  type: 'user' | 'admin';
}

export class SessionService {
  private static instance: SessionService;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start automatic cleanup of expired sessions every 5 minutes
    this.startAutomaticCleanup();
  }

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
  }

  /**
   * Start automatic cleanup of expired sessions
   */
  private startAutomaticCleanup(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Stop automatic cleanup (for testing or shutdown)
   */
  public stopAutomaticCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Issue a new user session JWT
   */
  public issueUserSessionJWT(wallet: `0x${string}`): { jwt: string; session: Session } {
    const sessionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + env.SESSION_TTL_SECONDS;

    const payload: JWTPayload = {
      sub: wallet,
      typ: 'user',
      jti: sessionId,
      iat: now,
      exp: expiresAt
    };

    const token = jwt.sign(payload, env.JWT_SECRET);

    const session: Session = {
      id: sessionId,
      wallet,
      createdAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      type: 'user'
    };

    // Store session in database
    this.storeSession(session);

    return { jwt: token, session };
  }

  /**
   * Issue a new admin session JWT
   */
  public issueAdminSessionJWT(wallet: `0x${string}`): { jwt: string; session: Session } {
    const sessionId = uuidv4();
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + env.SESSION_TTL_SECONDS;

    const payload: JWTPayload = {
      sub: wallet,
      typ: 'admin',
      jti: sessionId,
      iat: now,
      exp: expiresAt
    };

    const token = jwt.sign(payload, env.JWT_SECRET);

    const session: Session = {
      id: sessionId,
      wallet,
      createdAt: new Date(now * 1000).toISOString(),
      expiresAt: new Date(expiresAt * 1000).toISOString(),
      type: 'admin'
    };

    // Store session in database
    this.storeSession(session);

    return { jwt: token, session };
  }

  /**
   * Verify and decode a JWT token
   */
  public verifyJWT(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired JWT token');
    }
  }

  /**
   * Get session data from JWT token
   */
  public getSessionData(token: string): SessionData {
    const payload = this.verifyJWT(token);
    return {
      wallet: payload.sub as `0x${string}`,
      type: payload.typ
    };
  }

  /**
   * Check if a session is valid and clean up if expired
   */
  public isSessionValid(sessionId: string): boolean {
    const db = getDatabase();
    const session = db.sessions.find(s => s.id === sessionId);
    
    if (!session) return false;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    // If session is expired, remove it immediately
    if (now >= expiresAt) {
      this.invalidateSession(sessionId);
      return false;
    }
    
    return true;
  }

  /**
   * Invalidate a session (logout) and clean up immediately
   */
  public invalidateSession(sessionId: string): boolean {
    const db = getDatabase();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      db.sessions.splice(sessionIndex, 1);
      saveDatabase();
      return true;
    }
    return false;
  }

  /**
   * Invalidate all sessions for a specific wallet (force logout from all devices)
   */
  public invalidateAllSessionsForWallet(wallet: `0x${string}`): number {
    const db = getDatabase();
    const initialLength = db.sessions.length;
    
    db.sessions = db.sessions.filter(session => session.wallet !== wallet);
    
    const removedCount = initialLength - db.sessions.length;
    if (removedCount > 0) {
      saveDatabase();
    }
    
    return removedCount;
  }

  /**
   * Clean up expired sessions and return count of removed sessions
   */
  public cleanupExpiredSessions(): number {
    const db = getDatabase();
    const now = new Date();
    const initialLength = db.sessions.length;
    
    const validSessions = db.sessions.filter(session => {
      const expiresAt = new Date(session.expiresAt);
      return now < expiresAt;
    });

    const removedCount = initialLength - validSessions.length;
    if (removedCount > 0) {
      db.sessions = validSessions;
      saveDatabase();
      console.log(`Cleaned up ${removedCount} expired sessions`);
    }

    return removedCount;
  }

  /**
   * Get session statistics
   */
  public getSessionStats(): {
    total: number;
    active: number;
    expired: number;
    byType: { user: number; admin: number };
  } {
    const db = getDatabase();
    const now = new Date();
    
    let active = 0;
    let expired = 0;
    let userCount = 0;
    let adminCount = 0;
    
    for (const session of db.sessions) {
      const expiresAt = new Date(session.expiresAt);
      if (now < expiresAt) {
        active++;
      } else {
        expired++;
      }
      
      if (session.type === 'user') {
        userCount++;
      } else if (session.type === 'admin') {
        adminCount++;
      }
    }
    
    return {
      total: db.sessions.length,
      active,
      expired,
      byType: { user: userCount, admin: adminCount }
    };
  }

  /**
   * Store session in database
   */
  private storeSession(session: Session): void {
    const db = getDatabase();
    db.sessions.push(session);
    saveDatabase();
  }

  /**
   * Get all active sessions for a wallet
   */
  public getActiveSessions(wallet: `0x${string}`): Session[] {
    const db = getDatabase();
    const now = new Date();
    
    return db.sessions.filter(session => 
      session.wallet === wallet && 
      new Date(session.expiresAt) > now
    );
  }
}

// Export singleton instance
export const sessionService = SessionService.getInstance();
