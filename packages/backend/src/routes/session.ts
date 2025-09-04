import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { sessionService } from '../services/sessionService';
import { setSessionCookie, clearSessionCookie, requireAuth } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimit';
import { setCsrfToken } from '../middlewares/csrf';
import { env } from '../env';
import { getDatabase, saveDatabase } from '../db/init';
import { Challenge } from '../types';
import { ValidationError, AuthenticationError } from '../middlewares/errors';

const router = Router();

// Validation schemas
const walletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
});

const siweSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature required'),
  message: z.string().min(1, 'Message required')
});

const challengeVerifySchema = z.object({
  challengeId: z.string().uuid('Invalid challenge ID')
});

// CSRF token endpoint
router.get('/csrf', setCsrfToken, (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: { token: res.locals['csrfToken'] }
  });
});

// Get nonce for signing
router.post('/nonce', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { wallet } = walletSchema.parse(req.body);
    const nonce = uuidv4();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    
    const message = composeSignMessage(wallet, nonce, expiresAt);
    
    res.json({
      success: true,
      data: {
        nonce,
        message,
        expiresAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Verify signature and create session
router.post('/siwe', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { wallet, signature, message } = siweSchema.parse(req.body);
    
    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      throw new AuthenticationError('Invalid signature');
    }
    
    // Issue session JWT
    const { jwt, session } = sessionService.issueUserSessionJWT(wallet as `0x${string}`);
    
    // Set session cookie
    setSessionCookie(res, jwt, env.SESSION_TTL_SECONDS, env.SESSION_COOKIE_NAME);
    
    res.json({
      success: true,
      data: {
        message: 'Session created successfully',
        session: {
          wallet: session.wallet,
          sessionId: session.id,
          expiresAt: session.expiresAt
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// ThetaPass authentication endpoint
router.post('/thetapass', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { wallet, type } = walletSchema.extend({
      type: z.string().default('thetapass')
    }).parse(req.body);
    
    // For ThetaPass, we trust the wallet address since it comes from ThetaDrop
    // In production, you might want to add additional verification
    
    // Issue session JWT
    const { jwt, session } = sessionService.issueUserSessionJWT(wallet as `0x${string}`);
    
    // Set session cookie
    setSessionCookie(res, jwt, env.SESSION_TTL_SECONDS, env.SESSION_COOKIE_NAME);
    
    res.json({
      success: true,
      data: {
        message: 'ThetaPass session created successfully',
        session: {
          wallet: session.wallet,
          type: type,
          sessionId: session.id,
          expiresAt: session.expiresAt
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Create TFuel challenge
router.post('/challenge/create', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { wallet } = walletSchema.parse(req.body);
    
    // Generate random amount (3 decimal places)
    const amount = randomAmount();
    const expiresAt = new Date(Date.now() + env.CHALLENGE_TTL_SECONDS * 1000).toISOString();
    
    const challenge: Challenge = {
      id: uuidv4(),
      wallet: wallet as `0x${string}`,
      amount,
      depositAddress: env.ORG_DEPOSIT_ADDRESS as `0x${string}`,
      expiresAt,
      status: 'pending'
    };
    
    // Store challenge in database
    const db = getDatabase();
    db.challenges.push(challenge);
    saveDatabase();
    
    res.json({
      success: true,
      data: {
        challengeId: challenge.id,
        amount: challenge.amount,
        depositAddress: challenge.depositAddress,
        expiresAt: challenge.expiresAt
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Verify challenge completion
router.post('/challenge/verify', authRateLimiter, (req: Request, res: Response) => {
  try {
    const { challengeId } = challengeVerifySchema.parse(req.body);
    
    // Find challenge in database
    const db = getDatabase();
    const challenge = db.challenges.find(c => c.id === challengeId);
    
    if (!challenge) {
      throw new ValidationError('Challenge not found');
    }
    
    if (challenge.status === 'expired') {
      throw new ValidationError('Challenge has expired');
    }
    
    if (challenge.status === 'verified') {
      throw new ValidationError('Challenge already verified');
    }
    
    // Check if challenge has expired
    if (new Date() > new Date(challenge.expiresAt)) {
      challenge.status = 'expired';
      saveDatabase();
      throw new ValidationError('Challenge has expired');
    }
    
    // TODO: Implement actual blockchain verification
    // For now, we'll simulate verification
    // In production, this would check the blockchain for the transfer
    
    // Mark challenge as verified
    challenge.status = 'verified';
    saveDatabase();
    
    // Issue session JWT
    const { jwt, session } = sessionService.issueUserSessionJWT(challenge.wallet);
    
    // Set session cookie
    setSessionCookie(res, jwt, env.SESSION_TTL_SECONDS, env.SESSION_COOKIE_NAME);
    
    res.json({
      success: true,
      data: {
        message: 'Challenge verified and session created',
        session: {
          wallet: session.wallet,
          expiresAt: session.expiresAt
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Get current session info
router.get('/me', requireAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      wallet: req.user!.wallet,
      type: req.user!.type,
      sessionId: req.user!.sessionId,
      expiresAt: new Date(Date.now() + env.SESSION_TTL_SECONDS * 1000).toISOString()
    }
  });
});

// Logout (clear session)
router.post('/logout', requireAuth, (req: Request, res: Response) => {
  // Invalidate session in database
  sessionService.invalidateSession(req.user!.sessionId);
  
  // Clear session cookie
  clearSessionCookie(res, env.SESSION_COOKIE_NAME);
  
  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

// Helper functions
function composeSignMessage(wallet: string, nonce: string, expiresAt: string, nftSummary?: string): string {
  return [
    'THETA EuroCon Registration',
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt}`,
    nftSummary ? `NFTs: ${nftSummary}` : '',
  ].filter(Boolean).join('\n');
}

function randomAmount(): string {
  const suffix = Math.floor(Math.random() * 900) + 100; // 100..999
  return (suffix / 1000).toFixed(3);                   // "0.347" .. "0.999"
}

export default router;
