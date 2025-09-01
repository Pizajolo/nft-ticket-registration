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

  private constructor() {}

  public static getInstance(): SessionService {
    if (!SessionService.instance) {
      SessionService.instance = new SessionService();
    }
    return SessionService.instance;
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
   * Check if a session is valid
   */
  public isSessionValid(sessionId: string): boolean {
    const db = getDatabase();
    const session = db.sessions.find(s => s.id === sessionId);
    
    if (!session) return false;
    
    const now = new Date();
    const expiresAt = new Date(session.expiresAt);
    
    return now < expiresAt;
  }

  /**
   * Invalidate a session (logout)
   */
  public invalidateSession(sessionId: string): void {
    const db = getDatabase();
    const sessionIndex = db.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex !== -1) {
      db.sessions.splice(sessionIndex, 1);
      saveDatabase();
    }
  }

  /**
   * Clean up expired sessions
   */
  public cleanupExpiredSessions(): void {
    const db = getDatabase();
    const now = new Date();
    
    const validSessions = db.sessions.filter(session => {
      const expiresAt = new Date(session.expiresAt);
      return now < expiresAt;
    });

    if (validSessions.length !== db.sessions.length) {
      db.sessions = validSessions;
      saveDatabase();
    }
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
