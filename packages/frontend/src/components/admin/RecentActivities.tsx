"use client";

import { useState, useEffect } from 'react';

interface AdminActivity {
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

interface RecentActivitiesProps {
  limit?: number;
}

export function RecentActivities({ limit = 10 }: RecentActivitiesProps) {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/admin/activities?limit=${limit}`,
          { credentials: 'include' }
        );
        
        if (response.ok) {
          const data = await response.json();
          setActivities(data.data.activities);
        } else {
          throw new Error('Failed to fetch activities');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to fetch activities');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [limit]);

  const getActivityIcon = (type: AdminActivity['type']) => {
    switch (type) {
      case 'registration_created':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'registration_updated':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'registration_deleted':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
        );
      case 'checkin':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'checkout':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'admin_login':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      case 'admin_logout':
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getActivityColor = (type: AdminActivity['type']) => {
    switch (type) {
      case 'registration_created':
      case 'checkin':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'registration_updated':
      case 'admin_login':
        return 'text-blue-800 bg-blue-50 border-blue-200';
      case 'registration_deleted':
        return 'text-red-800 bg-red-50 border-red-200';
      case 'checkout':
        return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'admin_logout':
        return 'text-gray-800 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading activities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">Failed to load activities</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="mt-2 text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3">
          {getActivityIcon(activity.type)}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium text-gray-900">
                {activity.description}
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getActivityColor(activity.type)}`}>
                {activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            </div>
            
            {activity.details.targetName && (
              <p className="text-sm text-gray-600 mt-1">
                Attendee: <span className="font-medium">{activity.details.targetName}</span>
              </p>
            )}
            
            {activity.details.nftContract && activity.details.nftTokenId && (
              <p className="text-sm text-gray-600">
                NFT: Token #{activity.details.nftTokenId} on {activity.details.nftContract.slice(0, 6)}...{activity.details.nftContract.slice(-4)}
              </p>
            )}
            
            {activity.details.changes && Object.keys(activity.details.changes).length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="font-medium">Changes:</span>
                {Object.entries(activity.details.changes).map(([key, change]) => (
                  <div key={key} className="ml-2">
                    {key}: {change.from} → {change.to}
                  </div>
                ))}
              </div>
            )}
            
            <p className="text-xs text-gray-400 mt-2">
              {formatTimestamp(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
