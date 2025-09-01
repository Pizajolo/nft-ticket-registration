import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

const envSchema = z.object({
  // Server
  PORT: z.string().transform(Number).default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  
  // Admin
  ADMIN_PASSWORD_HASH: z.string(),
  ADMIN_WALLET: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  
  // Base URL
  BASE_URL: z.string().url().default('http://localhost:4000'),
  
  // Database
  DB_FILE: z.string().default('./src/db/db.json'),
  
  // CORS
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  
  // Chain
  CHAIN_NAME: z.string().default('theta'),
  CHAIN_ID: z.string().transform(Number).default('361'),
  RPC_URL: z.string().url(),
  TNT721_CONTRACTS: z.string(),
  ORG_DEPOSIT_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  
  // Challenge
  CHALLENGE_TTL_SECONDS: z.string().transform(Number).default('300'),
  CHALLENGE_MIN_AMOUNT: z.string().transform(Number).default('0.0001'),
  
  // Session
  SESSION_COOKIE_NAME: z.string().default('eucon_sess'),
  SESSION_TTL_SECONDS: z.string().transform(Number).default('3600'),
  CSRF_COOKIE_NAME: z.string().default('eucon_csrf'),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envParse.error.format());
  process.exit(1);
}

export const env = envParse.data;

// Helper function to get TNT721 contracts as array
export const getTNT721Contracts = (): `0x${string}`[] => {
  return env.TNT721_CONTRACTS.split(',').map(contract => 
    contract.trim() as `0x${string}`
  );
};

// Helper function to get CORS origins as array
export const getCorsOrigins = (): string[] => {
  return env.CORS_ORIGINS.split(',').map(origin => origin.trim());
};
