import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requireUserAuth } from '../middlewares/auth';
import { ValidationError } from '../middlewares/errors';
import { RegistrationInput, RegistrationRecord } from '../types';
import { getDatabase, saveDatabase } from '../db/init';


const router = Router();

// Validation schema
const registrationSchema = z.object({
  items: z.array(z.object({
    nft: z.object({
      contract: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
      tokenId: z.string().min(1, 'Token ID required')
    }),
    firstName: z.string().min(1, 'First name required').max(100, 'First name too long'),
    lastName: z.string().min(1, 'Last name required').max(100, 'Last name too long'),
    email: z.string().email('Invalid email address').max(255, 'Email too long'),
    method: z.enum(['sign', 'transfer'])
  })).min(1, 'At least one registration required').max(10, 'Maximum 10 registrations per request')
});

// Submit registration(s)
router.post('/submit', requireUserAuth, async (req: Request, res: Response) => {
  try {
    const { items } = registrationSchema.parse(req.body);
    const sessionWallet = req.user!.wallet;
    
    const db = getDatabase();
    const registrations: RegistrationRecord[] = [];
    
    for (const item of items) {
      // TODO: Verify NFT ownership on blockchain
      // For now, we'll assume ownership is valid
      
      const registration: RegistrationRecord = {
        id: uuidv4(),
        wallet: sessionWallet, // Always use session wallet
        nft: {
          contract: item.nft.contract as `0x${string}`,
          tokenId: item.nft.tokenId
        },
        firstName: item.firstName,
        lastName: item.lastName,
        email: item.email,
        method: item.method,
        verifiedAt: new Date().toISOString(),
        ticketId: uuidv4(), // Generate ticket ID
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
        message: `Successfully registered ${registrations.length} NFT(s)`,
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

export default router;
