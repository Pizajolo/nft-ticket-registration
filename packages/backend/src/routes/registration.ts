import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { requireUserAuth } from '../middlewares/auth';
import { ValidationError } from '../middlewares/errors';
import { RegistrationRecord } from '../types';
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
    const results: Array<{ id: string; ticketId: string; nft: any; firstName: string; lastName: string; email: string; verifiedAt: string; isUpdate: boolean }> = [];
    
    for (const item of items) {
      // TODO: Verify NFT ownership on blockchain
      // For now, we'll assume ownership is valid
      
      // Check if registration already exists for this NFT
      const existingRegistration = db.registrations.find(
        (reg: any) => 
          reg.wallet.toLowerCase() === sessionWallet.toLowerCase() &&
          reg.nft.contract.toLowerCase() === item.nft.contract.toLowerCase() &&
          reg.nft.tokenId === item.nft.tokenId
      );
      
      if (existingRegistration) {
        // Update existing registration
        existingRegistration.firstName = item.firstName;
        existingRegistration.lastName = item.lastName;
        existingRegistration.email = item.email;
        existingRegistration.method = item.method;
        existingRegistration.verifiedAt = new Date().toISOString();
        
        results.push({
          id: existingRegistration.id,
          ticketId: existingRegistration.ticketId || '',
          nft: existingRegistration.nft,
          firstName: existingRegistration.firstName,
          lastName: existingRegistration.lastName,
          email: existingRegistration.email,
          verifiedAt: existingRegistration.verifiedAt || new Date().toISOString(),
          isUpdate: true
        });
      } else {
        // Create new registration
        const newRegistration: RegistrationRecord = {
          id: uuidv4(),
          wallet: sessionWallet,
          nft: {
            contract: item.nft.contract as `0x${string}`,
            tokenId: item.nft.tokenId
          },
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
          method: item.method,
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
        
        db.registrations.push(newRegistration);
        
        results.push({
          id: newRegistration.id,
          ticketId: newRegistration.ticketId || '',
          nft: newRegistration.nft,
          firstName: newRegistration.firstName,
          lastName: newRegistration.lastName,
          email: newRegistration.email,
          verifiedAt: newRegistration.verifiedAt || new Date().toISOString(),
          isUpdate: false
        });
      }
    }
    
    await saveDatabase();
    
    const updatedCount = results.filter(r => r.isUpdate).length;
    const newCount = results.filter(r => !r.isUpdate).length;
    
    let message = '';
    if (updatedCount > 0 && newCount > 0) {
      message = `Updated ${updatedCount} existing registration(s) and created ${newCount} new registration(s)`;
    } else if (updatedCount > 0) {
      message = `Updated ${updatedCount} existing registration(s)`;
    } else {
      message = `Successfully registered ${newCount} NFT(s)`;
    }
    
    res.json({
      success: true,
      data: {
        message,
        registrations: results.map(r => ({
          id: r.id,
          ticketId: r.ticketId,
          nft: r.nft,
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          verifiedAt: r.verifiedAt,
          isUpdate: r.isUpdate
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
