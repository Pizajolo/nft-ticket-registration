import { getDatabase, saveDatabase } from '../db/init';

export interface AdminActivity {
  id: string;
  type: 'registration_created' | 'registration_updated' | 'registration_deleted' | 'checkin' | 'checkout' | 'admin_login' | 'admin_logout';
  description: string;
  details: {
    adminWallet: string;
    targetWallet?: string;
    targetName?: string;
    nftContract?: string;
    nftTokenId?: string;
    ticketId?: string;
    changes?: Record<string, any>;
  };
  timestamp: string;
  metadata?: Record<string, any>;
}

export class ActivityService {
  /**
   * Log an admin activity
   */
  static async logActivity(activity: Omit<AdminActivity, 'id' | 'timestamp'>): Promise<void> {
    const db = getDatabase();
    
    const newActivity: AdminActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    // Initialize activities array if it doesn't exist
    if (!db.activities) {
      db.activities = [];
    }
    
    db.activities.push(newActivity);
    
    // Keep only last 100 activities to prevent database bloat
    if (db.activities.length > 100) {
      db.activities = db.activities.slice(-100);
    }
    
    await saveDatabase();
  }

  /**
   * Get recent activities (last N activities)
   */
  static getRecentActivities(limit: number = 10): AdminActivity[] {
    const db = getDatabase();
    
    if (!db.activities) {
      return [];
    }
    
    return db.activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get activities by type
   */
  static getActivitiesByType(type: AdminActivity['type'], limit: number = 10): AdminActivity[] {
    const db = getDatabase();
    
    if (!db.activities) {
      return [];
    }
    
    return db.activities
      .filter(activity => activity.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get activities for a specific wallet
   */
  static getActivitiesForWallet(wallet: string, limit: number = 10): AdminActivity[] {
    const db = getDatabase();
    
    if (!db.activities) {
      return [];
    }
    
    return db.activities
      .filter(activity => 
        activity.details.targetWallet?.toLowerCase() === wallet.toLowerCase() ||
        activity.details.adminWallet.toLowerCase() === wallet.toLowerCase()
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear old activities (older than N days)
   */
  static async clearOldActivities(daysOld: number = 30): Promise<void> {
    const db = getDatabase();
    
    if (!db.activities) {
      return;
    }
    
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    db.activities = db.activities.filter(activity => 
      new Date(activity.timestamp) > cutoffDate
    );
    
    await saveDatabase();
  }

  /**
   * Helper methods for common activities
   */
  static async logRegistrationCreated(adminWallet: string, targetWallet: string, targetName: string, nftContract: string, nftTokenId: string, ticketId: string): Promise<void> {
    await this.logActivity({
      type: 'registration_created',
      description: `Registration created for ${targetName}`,
      details: {
        adminWallet,
        targetWallet,
        targetName,
        nftContract,
        nftTokenId,
        ticketId
      }
    });
  }

  static async logRegistrationUpdated(adminWallet: string, targetWallet: string, targetName: string, changes: Record<string, any>): Promise<void> {
    await this.logActivity({
      type: 'registration_updated',
      description: `Registration updated for ${targetName}`,
      details: {
        adminWallet,
        targetWallet,
        targetName,
        changes
      }
    });
  }

  static async logRegistrationDeleted(adminWallet: string, targetWallet: string, targetName: string, nftContract: string, nftTokenId: string): Promise<void> {
    await this.logActivity({
      type: 'registration_deleted',
      description: `Registration deleted for ${targetName}`,
      details: {
        adminWallet,
        targetWallet,
        targetName,
        nftContract,
        nftTokenId
      }
    });
  }

  static async logCheckIn(adminWallet: string, targetWallet: string, targetName: string, ticketId: string): Promise<void> {
    await this.logActivity({
      type: 'checkin',
      description: `Check-in for ${targetName}`,
      details: {
        adminWallet,
        targetWallet,
        targetName,
        ticketId
      }
    });
  }

  static async logCheckOut(adminWallet: string, targetWallet: string, targetName: string, ticketId: string): Promise<void> {
    await this.logActivity({
      type: 'checkout',
      description: `Check-out for ${targetName}`,
      details: {
        adminWallet,
        targetWallet,
        targetName,
        ticketId
      }
    });
  }

  static async logAdminLogin(adminWallet: string): Promise<void> {
    await this.logActivity({
      type: 'admin_login',
      description: 'Admin logged in',
      details: {
        adminWallet
      }
    });
  }

  static async logAdminLogout(adminWallet: string): Promise<void> {
    await this.logActivity({
      type: 'admin_logout',
      description: 'Admin logged out',
      details: {
        adminWallet
      }
    });
  }
}
