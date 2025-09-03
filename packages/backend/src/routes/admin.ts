import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { requireAdminAuth } from '../middlewares/auth';
import { setSessionCookie, clearSessionCookie } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimit';
import { ValidationError, AuthenticationError } from '../middlewares/errors';
import { env } from '../env';
import { sessionService } from '../services/sessionService';
import { getDatabase, saveDatabase } from '../db/init';
import { ContractService } from '../services/contractService';

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

const registrationSchema = z.object({
  items: z.array(z.object({
    nft: z.object({
      contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
      tokenId: z.string().min(1, 'Token ID required')
    }),
    firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
    lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
    email: z.string().email('Invalid email address').max(255, 'Email too long'),
    wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional()
  })).min(1, 'At least one registration required').max(10, 'Maximum 10 registrations per request')
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
    
    // Enhance registrations with contract names from cache
    const enhancedRegistrations = registrations.map(reg => {
      const contractInfo = db.contracts[reg.nft.contract.toLowerCase()];
      return {
        ...reg,
        nft: {
          ...reg.nft,
          contractName: contractInfo?.name || 'Unknown'
        }
      };
    });
    
    // Apply pagination
    const pageNum = parseInt(page.toString());
    const limitNum = parseInt(limit.toString());
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedRegistrations = enhancedRegistrations.slice(startIndex, endIndex);
    
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
    
    // Enhance response with contract name
    const contractInfo = db.contracts[registration.nft.contract.toLowerCase()];
    const enhancedRegistration = {
      ...registration,
      nft: {
        ...registration.nft,
        contractName: contractInfo?.name || 'Unknown'
      }
    };
    
    res.json({
      success: true,
      data: {
        message: 'Registration updated successfully',
        registration: enhancedRegistration
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Create new registration (admin only)
router.post('/registrations', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { items } = registrationSchema.parse(req.body);
    
    const db = getDatabase();
    const registrations: any[] = [];
    
    for (const item of items) {
      // Fetch contract name if not already cached
      const contractInfo = await ContractService.getContractInfo(item.nft.contract);
      
      const registration: any = {
        id: uuidv4(),
        wallet: item.wallet || req.user!.wallet, // Use provided wallet or admin wallet
        nft: {
          contract: item.nft.contract as `0x${string}`,
          tokenId: item.nft.tokenId,
          contractName: contractInfo.name
        },
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        method: 'admin',
        verifiedAt: new Date().toISOString(),
        ticketId: uuidv4(),
        qr: {
          payload: JSON.stringify({
            t: 'eucon',
            v: 1,
            ticketId: uuidv4(),
            nft: {
              contract: item.nft.contract as `0x${string}`,
              tokenId: item.nft.tokenId
            }
          })
        }
      };
      
      registrations.push(registration);
    }
    
    // Store registrations in database
    db.registrations.push(...registrations);
    await saveDatabase();
    
    res.json({
      success: true,
      data: {
        message: `Successfully created ${registrations.length} registration(s)`,
        registrations: registrations.map(r => ({
          id: r.id,
          ticketId: r.ticketId,
          nft: r.nft,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          verifiedAt: r.verifiedAt
        }))
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

// Delete registration (admin only)
router.delete('/registrations/:id', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const db = getDatabase();
    const registrationIndex = db.registrations.findIndex(reg => reg.id === id);
    
    if (registrationIndex === -1) {
      throw new ValidationError('Registration not found');
    }
    
    // Remove registration
    db.registrations.splice(registrationIndex, 1);
    await saveDatabase();
    
    res.json({
      success: true,
      data: { message: 'Registration deleted successfully' }
    });
  } catch (error) {
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

// Get admin dashboard statistics
router.get('/stats', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    
    // Get basic stats from registrations
    const totalRegistrations = db.registrations.length;
    const checkedInCount = db.registrations.filter(reg => reg.checkedInAt).length;
    const pendingCount = totalRegistrations - checkedInCount;
    
    // Get unique contracts count
    const uniqueContracts = new Set(db.registrations.map(reg => reg.nft.contract)).size;
    
    // Get total supply from all contracts
    const uniqueContractAddresses = Array.from(new Set(db.registrations.map(reg => reg.nft.contract)));
    const totalSupply = await ContractService.getTotalSupplyFromContracts(uniqueContractAddresses);
    
    res.json({
      success: true,
      data: {
        contracts: uniqueContracts,
        totalNFTs: totalSupply || totalRegistrations, // Use total supply if available, fallback to registrations
        registeredTickets: totalRegistrations,
        checkedInTickets: checkedInCount,
        pendingTickets: pendingCount
      }
    });
  } catch (error) {
    throw error;
  }
});

// Get available contracts for admin registration
router.get('/contracts', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const { getTNT721Contracts } = await import('../env');
    
    // Get contracts from env file
    const envContracts = getTNT721Contracts();
    
    // Enhance with cached names and symbols
    const contracts = envContracts.map(address => {
      const cached = db.contracts[address.toLowerCase()];
      return {
        address,
        name: cached?.name || 'Unknown',
        symbol: cached?.symbol
      };
    });
    
    res.json({
      success: true,
      data: { contracts }
    });
  } catch (error) {
    throw error;
  }
});

// Get NFTs owned by a specific wallet for admin registration
router.post('/wallet-nfts', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { wallet } = req.body;
    
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new ValidationError('Invalid wallet address');
    }
    
    const { getTNT721Contracts } = await import('../env');
    const contracts = getTNT721Contracts();
    
    const rpcUrl = process.env['RPC_URL'] || 'https://eth-rpc-api.thetatoken.org/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    const ERC721_ENUM_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)'
    ];
    
    const results: Array<{ contract: string; tokenId: string; contractName: string }> = [];
    
    for (const addr of contracts) {
      try {
        const contract = new ethers.Contract(addr, ERC721_ENUM_ABI, provider);
        
        // Get contract name from cache
        const contractInfo = await ContractService.getContractInfo(addr);
        
        const bal: bigint = await (contract as any)['balanceOf'](wallet);
        const count = Number(bal);
        
        for (let i = 0; i < count; i++) {
          try {
            const tokenIdBn: bigint = await (contract as any)['tokenOfOwnerByIndex'](wallet, i);
            results.push({ 
              contract: addr, 
              tokenId: tokenIdBn.toString(), 
              contractName: contractInfo.name 
            });
          } catch {}
        }
      } catch {}
    }
    
    res.json({
      success: true,
      data: {
        nfts: results,
        total: results.length
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid request data');
    }
    throw error;
  }
});

export default router;
