export type Method = "sign" | "transfer";

export interface Session {
  id: string;                          // UUID
  wallet: `0x${string}`;
  createdAt: string;                    // ISO
  expiresAt: string;                    // ISO
  type: "user" | "admin";
}

export interface RegistrationInput {
  wallet: `0x${string}`;
  nft: { contract: `0x${string}`; tokenId: string };
  firstName: string;
  lastName: string;
  email: string;
  method: Method;                       // kept for audit
}

export interface RegistrationRecord extends RegistrationInput {
  id: string;                           // UUID
  verifiedAt?: string;                  // ISO
  ticketId?: string;                    // UUID
  qr?: { dataUrl?: string; payload: string };
  checkedInAt?: string;                 // ISO
  notes?: string;
}

export interface Challenge {
  id: string;                           // UUID
  wallet: `0x${string}`;
  amount: string;                       // e.g. "0.347"
  depositAddress: `0x${string}`;
  expiresAt: string;                    // ISO
  status: "pending" | "verified" | "expired";
  txHash?: `0x${string}`;
}

export interface AdminUser {
  id: string;
  email?: string;
  wallet?: `0x${string}`;
  passwordHash?: string;
}

export interface NFT {
  contract: `0x${string}`;
  tokenId: string;
  owner: `0x${string}`;
}

export interface Ticket {
  id: string;
  registrationId: string;
  qrDataUrl: string;
  qrPayload: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
