import { env } from '../env';
import { AdminUser } from '../types';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';
import path from 'path';

// Database schema
interface Database {
  sessions: any[];
  registrations: any[];
  challenges: any[];
  admins: AdminUser[];
  contracts: {
    [address: string]: {
      name: string;
      symbol?: string;
      fetchedAt: string;
    };
  };
  activities: any[];
  meta: {
    createdAt: string;
    version: string;
  };
}

const defaultData: Database = {
  sessions: [],
  registrations: [],
  challenges: [],
  admins: [
    {
      id: 'default',
      email: 'admin@theta-euro.com',
      passwordHash: '', // Will be set below
      wallet: env.ADMIN_WALLET as `0x${string}`
    }
  ],
  contracts: {},
  activities: [],
  meta: {
    createdAt: new Date().toISOString(),
    version: '1.0.0'
  }
};

let db: Database;

export const getDatabase = (): Database => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    // Ensure directory exists
    const dbDir = path.dirname(env.DB_FILE);
    await fs.mkdir(dbDir, { recursive: true });
    
    // Try to load existing data
    try {
      const data = await fs.readFile(env.DB_FILE, 'utf-8');
      db = JSON.parse(data);
      console.log('📊 Database loaded from existing file');
    } catch (error) {
      // File doesn't exist or is invalid, create default
      db = { ...defaultData };
      
      // Hash the admin password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      if (db.admins[0]) {
        db.admins[0].passwordHash = hashedPassword;
      }
      
      // Save to file
      await saveDatabase();
      console.log('📊 Database initialized with default data');
    }

    // Validate database structure
    validateDatabaseStructure();
    
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

const validateDatabaseStructure = (): void => {
  if (!db) return;

  const requiredKeys: (keyof Database)[] = ['sessions', 'registrations', 'challenges', 'admins', 'contracts', 'activities', 'meta'];
  
  for (const key of requiredKeys) {
    if (!(key in db)) {
      console.warn(`⚠️  Missing database key: ${key}, adding default value`);
      if (key === 'sessions') db.sessions = [];
      if (key === 'registrations') db.registrations = [];
      if (key === 'challenges') db.challenges = [];
      if (key === 'admins') db.admins = defaultData.admins;
      if (key === 'contracts') db.contracts = {};
      if (key === 'activities') db.activities = [];
      if (key === 'meta') db.meta = defaultData.meta;
    }
  }
};

// Helper function to save database
export const saveDatabase = async (): Promise<void> => {
  if (db) {
    await fs.writeFile(env.DB_FILE, JSON.stringify(db, null, 2));
  }
};

// Helper function to get database data
export const getDatabaseData = (): Database => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
};
