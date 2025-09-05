export interface NFT {
  contract: string;
  tokenId: string;
  name?: string;
  contractName?: string;
  existing?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}
