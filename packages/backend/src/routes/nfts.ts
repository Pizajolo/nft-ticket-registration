import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireUserAuth } from '../middlewares/auth';
import { ValidationError } from '../middlewares/errors';
import { getTNT721Contracts } from '../env';

const router = Router();

// Validation schema
const walletSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid wallet address').optional()
});

// Get NFTs owned by user (uses session wallet by default)
router.post('/of', requireUserAuth, async (req: Request, res: Response) => {
  try {
    const { wallet } = walletSchema.parse(req.body);
    const sessionWallet = req.user!.wallet;
    
    // If wallet is provided, it must match session wallet
    if (wallet && wallet.toLowerCase() !== sessionWallet.toLowerCase()) {
      throw new ValidationError('Wallet address must match session wallet');
    }
    
    const targetWallet = wallet || sessionWallet;
    const contracts = getTNT721Contracts();
    
    // TODO: Implement actual NFT retrieval from blockchain
    // For now, return mock data
    const mockNfts = [
      {
        contract: contracts[0],
        tokenId: '1',
        owner: targetWallet
      },
      {
        contract: contracts[0],
        tokenId: '2',
        owner: targetWallet
      }
    ];
    
    res.json({
      success: true,
      data: {
        nfts: mockNfts,
        total: mockNfts.length
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
