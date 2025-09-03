import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireUserAuth } from '../middlewares/auth';
import { ValidationError } from '../middlewares/errors';
import { getTNT721Contracts } from '../env';
import { getDatabase } from '../db/init';
import { ethers } from 'ethers';
import { ContractService } from '../services/contractService';

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

    if (wallet && wallet.toLowerCase() !== sessionWallet.toLowerCase()) {
      throw new ValidationError('Wallet address must match session wallet');
    }

    const owner = (wallet || sessionWallet) as `0x${string}`;
    const contracts = getTNT721Contracts();

    const rpcUrl = process.env['THETA_RPC_URL'] || 'https://eth-rpc-api.thetatoken.org/rpc';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const ERC721_ENUM_ABI = [
      'function balanceOf(address owner) view returns (uint256)',
      'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
      'function name() view returns (string)'
    ];

    const results: Array<{ contract: `0x${string}`; tokenId: string; owner: `0x${string}`; name?: string; existing?: { firstName: string; lastName: string; email: string } }> = [];

    for (const addr of contracts) {
      try {
        const contract = new ethers.Contract(addr, ERC721_ENUM_ABI, provider);
        
        // Get contract name using the ContractService (will cache it)
        const contractInfo = await ContractService.getContractInfo(addr);
        
        const bal: bigint = await (contract as any)['balanceOf'](owner);
        const count = Number(bal);
        for (let i = 0; i < count; i++) {
          try {
            const tokenIdBn: bigint = await (contract as any)['tokenOfOwnerByIndex'](owner, i);
            results.push({ 
              contract: addr as `0x${string}`, 
              tokenId: tokenIdBn.toString(), 
              owner, 
              name: contractInfo.name 
            });
          } catch {}
        }
      } catch {}
    }

    // Attach existing registration data when NFT still owned by same wallet
    const db = getDatabase();
    const byKey: Record<string, { firstName: string; lastName: string; email: string }> = {};
    for (const r of db.registrations) {
      if (r.wallet.toLowerCase() !== owner.toLowerCase()) continue;
      const k = `${r.nft.contract.toLowerCase()}:${r.nft.tokenId}`;
      byKey[k] = { firstName: r.firstName, lastName: r.lastName, email: r.email };
    }
    for (const item of results) {
      const k = `${item.contract.toLowerCase()}:${item.tokenId}`;
      if (byKey[k]) {
        item.existing = byKey[k];
      }
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
