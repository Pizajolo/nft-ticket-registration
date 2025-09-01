import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';
import { requireAdminAuth } from '../middlewares/auth';
import { setSessionCookie, clearSessionCookie } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimit';
import { ValidationError, AuthenticationError } from '../middlewares/errors';
import { env } from '../env';
import { sessionService } from '../services/sessionService';
import { getDatabase, saveDatabase } from '../db/init';

const router = Router();

// Validation schemas
const adminPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required')
});

const adminWalletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address')
});

const adminWalletSiweSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address'),
  signature: z.string().min(1, 'Signature required'),
  message: z.string().min(1, 'Message required')
});

const registrationUpdateSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  notes: z.string().max(1000).optional()
});

// Admin login with password
router.post('/login/password', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = adminPasswordSchema.parse(req.body);
    
    const db = getDatabase();
    const admin = db.admins.find(a => a.email === email);
    
    if (!admin || !admin.passwordHash) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Issue admin session JWT
    if (!admin.wallet) {
      throw new AuthenticationError('Admin wallet not configured');
    }
    const { jwt, session } = sessionService.issueAdminSessionJWT(admin.wallet);
    
    // Set session cookie
    setSessionCookie(res, jwt, env.SESSION_TTL_SECONDS, env.SESSION_COOKIE_NAME);
    
    res.json({
      success: true,
      data: {
        message: 'Admin login successful',
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

// Admin login with wallet (get nonce)
router.post('/login/wallet/nonce', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { wallet } = adminWalletSchema.parse(req.body);
    
    // Check if wallet is authorized admin
    if (wallet.toLowerCase() !== env.ADMIN_WALLET.toLowerCase()) {
      throw new AuthenticationError('Unauthorized wallet');
    }
    
    const nonce = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
    
    const message = `THETA EuroCon Admin Login\nWallet: ${wallet}\nNonce: ${nonce}\nExpires: ${expiresAt}`;
    
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

// Admin login with wallet (verify signature)
router.post('/login/wallet/siwe', authRateLimiter, async (req: Request, res: Response) => {
  try {
    const { wallet, signature, message } = adminWalletSiweSchema.parse(req.body);
    
    // Check if wallet is authorized admin
    if (wallet.toLowerCase() !== env.ADMIN_WALLET.toLowerCase()) {
      throw new AuthenticationError('Unauthorized wallet');
    }
    
    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    if (recoveredAddress.toLowerCase() !== wallet.toLowerCase()) {
      throw new AuthenticationError('Invalid signature');
    }
    
    // Issue admin session JWT
    const { jwt, session } = sessionService.issueAdminSessionJWT(wallet as `0x${string}`);
    
    // Set session cookie
    setSessionCookie(res, jwt, env.SESSION_TTL_SECONDS, env.SESSION_COOKIE_NAME);
    
    res.json({
      success: true,
      data: {
        message: 'Admin login successful',
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

// Admin logout
router.post('/logout', requireAdminAuth, async (req: Request, res: Response) => {
  // Invalidate session in database
  sessionService.invalidateSession(req.user!.sessionId);
  
  // Clear session cookie
  clearSessionCookie(res, env.SESSION_COOKIE_NAME);
  
  res.json({
    success: true,
    data: { message: 'Admin logged out successfully' }
  });
});

// Get all registrations (admin only)
router.get('/registrations', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { page = 1, limit = 50, search = '', status = '' } = req.query;
    
    let registrations = [...db.registrations];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toString().toLowerCase();
      registrations = registrations.filter(reg => 
        reg.firstName.toLowerCase().includes(searchLower) ||
        reg.lastName.toLowerCase().includes(searchLower) ||
        reg.email.toLowerCase().includes(searchLower) ||
        reg.wallet.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status === 'checked-in') {
      registrations = registrations.filter(reg => reg.checkedInAt);
    } else if (status === 'not-checked-in') {
      registrations = registrations.filter(reg => !reg.checkedInAt);
    }
    
    // Apply pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRegistrations = registrations.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        registrations: paginatedRegistrations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: registrations.length,
          totalPages: Math.ceil(registrations.length / limitNum)
        }
      }
    });
  } catch (error) {
    throw error;
  }
});

// Update registration (admin only)
router.patch('/registrations/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = registrationUpdateSchema.parse(req.body);
    
    const db = getDatabase();
    const registration = db.registrations.find(reg => reg.id === id);
    
    if (!registration) {
      throw new ValidationError('Registration not found');
    }
    
    // Apply updates
    Object.assign(registration, updates);
    
    // Save to database
    await saveDatabase();
    
    res.json({
      success: true,
      data: {
        message: 'Registration updated successfully',
        registration
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Export registrations as CSV (admin only)
router.get('/export.csv', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations.csv"');
    
    // CSV header
    const csvHeader = [
      'ID',
      'Wallet',
      'NFT Contract',
      'Token ID',
      'First Name',
      'Last Name',
      'Email',
      'Method',
      'Verified At',
      'Ticket ID',
      'Checked In At',
      'Notes'
    ].join(',') + '\n';
    
    res.write(csvHeader);
    
    // Write data rows
    for (const reg of db.registrations) {
      const row = [
        reg.id,
        reg.wallet,
        reg.nft.contract,
        reg.nft.tokenId,
        reg.firstName,
        reg.lastName,
        reg.email,
        reg.method,
        reg.verifiedAt || '',
        reg.ticketId || '',
        reg.checkedInAt || '',
        reg.notes || ''
      ].map(field => `"${field}"`).join(',') + '\n';
      
      res.write(row);
    }
    
    res.end();
  } catch (error) {
    throw error;
  }
});

export default router;
