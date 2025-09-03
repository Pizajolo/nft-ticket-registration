import { ethers } from 'ethers';
import { getDatabase, saveDatabase } from '../db/init';
import { env } from '../env';

// ERC-721 ABI for name() and symbol() functions
const ERC721_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)'
];

export class ContractService {
  private static provider: ethers.JsonRpcProvider;

  private static getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(env.RPC_URL);
    }
    return this.provider;
  }

  /**
   * Get contract name and symbol, fetching from blockchain if not cached
   */
  static async getContractInfo(contractAddress: string): Promise<{ name: string; symbol?: string }> {
    const db = getDatabase();
    const normalizedAddress = contractAddress.toLowerCase();

    // Check if we have cached contract info
    if (db.contracts[normalizedAddress]) {
      const cached = db.contracts[normalizedAddress];
      const cacheAge = Date.now() - new Date(cached.fetchedAt).getTime();
      
      // Cache is valid for 24 hours
      if (cacheAge < 24 * 60 * 60 * 1000) {
        const result: { name: string; symbol?: string } = {
          name: cached.name
        };
        
        if (cached.symbol) {
          result.symbol = cached.symbol;
        }
        
        return result;
      }
    }

    try {
      // Fetch contract info from blockchain
      const provider = this.getProvider();
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);

      // Fetch name and symbol in parallel
      const [name, symbol] = await Promise.all([
        (contract as any)['name']().catch(() => 'Unknown'),
        (contract as any)['symbol']().catch(() => undefined)
      ]);

      // Cache the result
      const contractData: { name: string; symbol?: string; fetchedAt: string } = {
        name: name || 'Unknown',
        fetchedAt: new Date().toISOString()
      };
      
      if (symbol) {
        contractData.symbol = symbol;
      }
      
      db.contracts[normalizedAddress] = contractData;

      // Save to database
      await saveDatabase();

      return { name: name || 'Unknown', symbol };
    } catch (error) {
      console.error(`Failed to fetch contract info for ${contractAddress}:`, error);
      
      // Store a fallback entry to prevent repeated failed requests
      db.contracts[normalizedAddress] = {
        name: 'Unknown',
        fetchedAt: new Date().toISOString()
      };
      
      await saveDatabase();
      
      return { name: 'Unknown' };
    }
  }

  /**
   * Get contract name only
   */
  static async getContractName(contractAddress: string): Promise<string> {
    const info = await this.getContractInfo(contractAddress);
    return info.name;
  }

  /**
   * Get all cached contract info
   */
  static getCachedContracts(): Record<string, { name: string; symbol?: string; fetchedAt: string }> {
    const db = getDatabase();
    return db.contracts;
  }

  /**
   * Clear contract cache (useful for testing or manual refresh)
   */
  static clearCache(): void {
    const db = getDatabase();
    db.contracts = {};
    saveDatabase();
  }

  /**
   * Get total supply from all contracts (expensive operation, should be cached)
   */
  static async getTotalSupplyFromContracts(contractAddresses: string[]): Promise<number> {
    try {
      const provider = this.getProvider();
      let totalSupply = 0;
      
      for (const address of contractAddresses) {
        try {
          const contract = new ethers.Contract(address, ['function totalSupply() view returns (uint256)'], provider);
          const supply = await (contract as any)['totalSupply']();
          totalSupply += Number(supply);
        } catch (error) {
          console.error(`Failed to get totalSupply for ${address}:`, error);
          // Continue with other contracts
        }
      }
      
      return totalSupply;
    } catch (error) {
      console.error('Failed to get total supply from contracts:', error);
      return 0;
    }
  }

  /**
   * Get cached total supply (if available)
   */
  static getCachedTotalSupply(): number {
    // For now, return 0 as we don't have a cached total supply
    // In the future, we could add this to the database and update it periodically
    return 0;
  }
}
