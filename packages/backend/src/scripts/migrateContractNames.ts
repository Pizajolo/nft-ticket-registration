import { getDatabase, saveDatabase } from '../db/init';
import { ContractService } from '../services/contractService';

async function migrateContractNames() {
  try {
    console.log('🔄 Starting contract names migration...');
    
    const db = getDatabase();
    let updatedCount = 0;
    
    for (const registration of db.registrations) {
      if (!registration.nft.contractName) {
        try {
          console.log(`📝 Fetching contract name for ${registration.nft.contract}...`);
          const contractInfo = await ContractService.getContractInfo(registration.nft.contract);
          
          // Update the registration with contract name
          if (!registration.nft.contractName) {
            registration.nft.contractName = contractInfo.name;
            updatedCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to fetch contract name for ${registration.nft.contract}:`, error);
          // Set a fallback name
          registration.nft.contractName = 'Unknown';
          updatedCount++;
        }
      }
    }
    
    if (updatedCount > 0) {
      await saveDatabase();
      console.log(`✅ Migration complete! Updated ${updatedCount} registrations with contract names.`);
    } else {
      console.log('✅ No registrations needed updating.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateContractNames().then(() => process.exit(0));
}

export { migrateContractNames };
