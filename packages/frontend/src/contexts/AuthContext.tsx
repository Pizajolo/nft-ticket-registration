'use client';
import '@/providers/ReownProvider';
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ethers, BrowserProvider, Eip1193Provider } from 'ethers';
import * as ThetaPass from '@thetalabs/theta-pass';
import { Magic } from 'magic-sdk';

// Types
export interface User {
  wallet: string;
  type: 'thetapass' | 'magic' | 'walletconnect' | 'siwe';
  isAuthenticated: boolean;
  sessionId?: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isMagicReady: boolean;
  isWalletConnected: boolean;
  loginWithThetaPass: () => Promise<void>;
  loginWithMagic: (email: string) => Promise<void>;
  loginWithWalletConnect: () => Promise<void>;
  loginWithSIWE: (wallet: string, signature: string, message: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize providers
  const [magic, setMagic] = useState<Magic | null>(null);

  // WalletConnect/AppKit (no hooks to avoid init race)
  const [wcConnected, setWcConnected] = useState(false);
  const [wcChainId, setWcChainId] = useState<number | null>(null);
  const [wcProvider, setWcProvider] = useState<any>(null);
  const [wcAddress, setWcAddress] = useState<string | null>(null);

  const getAppKit = (): any | null => {
    if (typeof window === 'undefined') return null;
    return (window as any).__REOWN_APPKIT__ || null;
  };

  const refreshWcState = async (): Promise<void> => {
    try {
      const appkit = getAppKit();
      if (!appkit) {
        setWcConnected(false);
        setWcProvider(null);
        setWcChainId(null);
        setWcAddress(null);
        return;
      }
      
      // Try multiple ways to get the provider
      const provider = appkit.getWalletProvider?.('eip155') || 
                      appkit.getProvider?.('eip155') ||
                      appkit.getWalletProvider?.() ||
                      appkit.getProvider?.();
                      
      if (!provider) {
        setWcConnected(false);
        setWcProvider(null);
        setWcChainId(null);
        setWcAddress(null);
        return;
      }
      
      setWcProvider(provider);
      
      // Get chain ID
      let chainIdHex: string | undefined;
      try {
        chainIdHex = await provider.request?.({ method: 'eth_chainId' });
      } catch (err) {
        console.log('Failed to get chain ID:', err);
      }
      
      const parsed = chainIdHex ? parseInt(chainIdHex, 16) : null;
      if (parsed !== null) setWcChainId(parsed);
      
      // Get wallet address
      try {
        const bp = new BrowserProvider(provider as unknown as Eip1193Provider);
        const signer = await bp.getSigner();
        const addr = await signer.getAddress();
        if (addr) {
          setWcAddress(addr.toLowerCase());
          setWcConnected(true);
          console.log('Wallet connected:', addr, 'Chain ID:', parsed);
        } else {
          setWcConnected(false);
          setWcAddress(null);
        }
      } catch (err) {
        console.log('Failed to get wallet address:', err);
        setWcConnected(false);
        setWcAddress(null);
      }
    } catch (err) {
      console.log('Error refreshing WC state:', err);
      setWcConnected(false);
      setWcProvider(null);
      setWcChainId(null);
      setWcAddress(null);
    }
  };

  useEffect(() => {
    refreshWcState();
    
    // Set up periodic refresh to catch connection changes
    const interval = setInterval(refreshWcState, 2000);
    
    // Also listen for AppKit events if available
    const appkit = getAppKit();
    if (appkit) {
      const handleConnect = () => {
        console.log('AppKit connected event');
        setTimeout(refreshWcState, 1000); // Delay to ensure state is updated
      };
      
      const handleDisconnect = () => {
        console.log('AppKit disconnected event');
        setWcConnected(false);
        setWcProvider(null);
        setWcChainId(null);
        setWcAddress(null);
      };
      
      // Try to listen for AppKit events
      if (typeof appkit.subscribe === 'function') {
        appkit.subscribe('connect', handleConnect);
        appkit.subscribe('disconnect', handleDisconnect);
      }
      
      return () => {
        clearInterval(interval);
        if (typeof appkit.unsubscribe === 'function') {
          appkit.unsubscribe('connect', handleConnect);
          appkit.unsubscribe('disconnect', handleDisconnect);
        }
      };
    }
    
    return () => clearInterval(interval);
  }, []);

  const isWalletConnected = Boolean(wcConnected && wcProvider && wcChainId === 361 && wcAddress);

  // Initialize Magic SDK on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const magicKey = process.env.NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY;
      
      // Check if Magic key is properly configured
      if (!magicKey || magicKey === 'your_magic_publishable_api_key_here' || magicKey.trim() === '') {
        console.warn('Magic SDK not configured: NEXT_PUBLIC_MAGIC_PUBLISHABLE_KEY is missing or set to placeholder value');
        setMagic(null);
        return;
      }
      
      try {
        const magicInstance = new Magic(magicKey);
        setMagic(magicInstance);
        console.log('Magic SDK initialized successfully');
      } catch (error) {
        console.warn('Magic SDK initialization failed:', error);
        setMagic(null);
      }
    }
  }, []);

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/session/me`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser({
          wallet: data.data.wallet,
          type: data.data.type || 'siwe',
          isAuthenticated: true,
          sessionId: data.data.sessionId,
        });
      }
    } catch (error) {
      console.log('No active session found');
    }
  };

  const loginWithThetaPass = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Request user's managed wallet address on ThetaDrop
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('ThetaPass redirect URL:', redirectUrl);
      
      // Use popup mode for better UX
      const response = await ThetaPass.requestAccounts(redirectUrl, null, true);
      console.log('ThetaPass request response:', response);
      
      if (response && response.result && response.result[0]) {
        const walletAddress = response.result[0];
        console.log('Wallet address from ThetaPass:', walletAddress);
        // SIWE-style: fetch nonce + sign with ThetaPass
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const nonceResp = await fetch(`${apiUrl}/api/session/nonce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ wallet: walletAddress })
        });
        if (!nonceResp.ok) throw new Error('Failed to get nonce');
        const nonceData = await nonceResp.json();
        const message: string = nonceData.data.message;

        // ThetaPass sign (popup)
        const signResp: any = await (ThetaPass as any).signMessage(message, redirectUrl, null, true);
        const result: any = signResp?.result || {};
        const signature: string | undefined = result?.signature || result?.[1];
        if (!signature) throw new Error('No signature from ThetaPass');

        // Create session
        const csrfToken = await getCSRFToken();
        const siweResp = await fetch(`${apiUrl}/api/session/siwe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          credentials: 'include',
          body: JSON.stringify({ wallet: walletAddress, signature, message })
        });
        if (!siweResp.ok) throw new Error('Failed to create session');
        const siweData = await siweResp.json();
        const sessionId = siweData?.data?.session?.sessionId || siweData?.data?.sessionId;

        setUser({
          wallet: walletAddress,
          type: 'thetapass',
          isAuthenticated: true,
          sessionId,
        });
        // Redirect to dashboard after successful ThetaPass SIWE
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      } else {
        throw new Error('No wallet address received from ThetaPass');
      }
    } catch (error) {
      console.error('ThetaPass error:', error);
      setError('ThetaPass authentication failed: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMagic = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    if (!magic) {
      setError('Magic Link is not configured. Please contact the administrator or use a different login method.');
      setIsLoading(false);
      return;
    }
    
    try {
      // Authenticate with Magic
      await magic.auth.loginWithEmailOTP({ email });
      
      // Get user info
      const metadata = await magic.user.getInfo();
      const walletAddress = metadata.publicAddress;

      if (walletAddress) {
        // Build signer via Magic provider
        const provider = new BrowserProvider((magic as any).rpcProvider as unknown as Eip1193Provider, 361);
        const signer = await provider.getSigner();

        // Get nonce + compose message from backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const nonceResp = await fetch(`${apiUrl}/api/session/nonce`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ wallet: walletAddress })
        });
        if (!nonceResp.ok) throw new Error('Failed to get nonce');
        const nonceData = await nonceResp.json();
        const message: string = nonceData.data.message;

        // Sign message using Magic signer
        const signature = await signer.signMessage(message);

        // Create session
        const csrfToken = await getCSRFToken();
        const siweResp = await fetch(`${apiUrl}/api/session/siwe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
          credentials: 'include',
          body: JSON.stringify({ wallet: walletAddress, signature, message })
        });
        if (!siweResp.ok) throw new Error('Failed to create session');
        const siweData = await siweResp.json();
        const sessionId = siweData?.data?.session?.sessionId || siweData?.data?.sessionId;

        setUser({
          wallet: walletAddress,
          type: 'magic',
          isAuthenticated: true,
          sessionId,
        });
      } else {
        setError('Failed to get wallet address from Magic');
      }
    } catch (error) {
      setError('Magic authentication failed');
      console.error('Magic error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithWalletConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First refresh the connection state to get the latest status
      await refreshWcState();
      
      // If not connected yet, open AppKit modal via global instance
      const appkit = (typeof window !== 'undefined' && (window as any).__REOWN_APPKIT__);
      if (!isWalletConnected || !wcProvider || !wcAddress) {
        console.log('Opening AppKit modal - not connected or missing provider/address');
        await appkit?.open?.();
        // Wait a bit for the connection to establish
        await new Promise(resolve => setTimeout(resolve, 2000));
        await refreshWcState();
        
        // If still not connected after opening modal, return early
        if (!isWalletConnected || !wcProvider || !wcAddress) {
          console.log('Still not connected after opening modal');
          return;
        }
      }

      // Ensure provider and correct chain (Theta 361)
      if (!wcProvider) throw new Error('Wallet provider not available');
      if (wcChainId !== 361) throw new Error('Please switch network to Theta (chainId 361) in the modal');

      // Build ethers BrowserProvider and signer
      const provider = new BrowserProvider(wcProvider as unknown as Eip1193Provider, 361);
      const signer = await provider.getSigner();
      const wallet = (await signer.getAddress()).toLowerCase();

      // SIWE-style flow
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const nonceResp = await fetch(`${apiUrl}/api/session/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ wallet })
      });
      if (!nonceResp.ok) throw new Error('Failed to get nonce');
      const nonceData = await nonceResp.json();
      const message: string = nonceData.data.message;

      const signature = await signer.signMessage(message);

      const csrfToken = await getCSRFToken();
      const siweResp = await fetch(`${apiUrl}/api/session/siwe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrfToken },
        credentials: 'include',
        body: JSON.stringify({ wallet, signature, message })
      });
      if (!siweResp.ok) throw new Error('Failed to create session');
      const siweData = await siweResp.json();
      const sessionId = siweData?.data?.session?.sessionId || siweData?.data?.sessionId;

      setUser({ wallet, type: 'walletconnect', isAuthenticated: true, sessionId });
    } catch (error) {
      // Avoid showing an error when the user is mid-connect
      if (isWalletConnected) {
        setError('WalletConnect authentication failed');
      }
      console.error('WalletConnect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSIWE = async (wallet: string, signature: string, message: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/session/siwe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': await getCSRFToken(),
        },
        credentials: 'include',
        body: JSON.stringify({ wallet, signature, message }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser({
          wallet: data.data.wallet,
          type: 'siwe',
          isAuthenticated: true,
          sessionId: data.data.sessionId,
        });
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'SIWE authentication failed');
      }
    } catch (error) {
      setError('SIWE authentication failed');
      console.error('SIWE error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('Starting logout process...');
      
      // 1. Clear session on backend first (this invalidates the session in database)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      try {
        await fetch(`${apiUrl}/api/session/logout`, {
          method: 'POST',
          credentials: 'include',
        });
        console.log('Backend session cleared successfully');
      } catch (error) {
        console.warn('Failed to clear backend session:', error);
        // Continue with logout even if backend call fails
      }
      
      // 2. Handle provider-specific logout
      if (user?.type === 'magic' && magic) {
        try {
          await magic.user.logout();
          console.log('Magic logout successful');
        } catch (error) {
          console.warn('Magic logout warning:', error);
        }
      }
      
      // 3. Handle WalletConnect/AppKit disconnection
      if (user?.type === 'walletconnect' || isWalletConnected) {
        try {
          console.log('Disconnecting WalletConnect...');
          
          // Try multiple disconnection methods
          const appkit = (typeof window !== 'undefined' && (window as any).__REOWN_APPKIT__);
          
          if (appkit) {
            // Method 1: AppKit disconnect
            if (typeof appkit.disconnect === 'function') {
              await appkit.disconnect();
              console.log('AppKit disconnect successful');
            }
            // Method 2: AppKit close modal if open
            if (typeof appkit.close === 'function') {
              appkit.close();
            }
          }
          
          // Method 3: Provider disconnect
          if (wcProvider) {
            if (typeof (wcProvider as any).disconnect === 'function') {
              await (wcProvider as any).disconnect();
              console.log('Provider disconnect successful');
            } else if (typeof (wcProvider as any).request === 'function') {
              try {
                await (wcProvider as any).request({ method: 'wallet_disconnect' });
                console.log('Wallet disconnect request successful');
              } catch (err) {
                console.log('Wallet disconnect request failed:', err);
              }
            }
          }
          
          // Method 4: Universal provider disconnect
          if (typeof window !== 'undefined' && (window as any).__REOWN_UNIVERSAL_PROVIDER__) {
            try {
              await (window as any).__REOWN_UNIVERSAL_PROVIDER__.disconnect();
              console.log('Universal provider disconnect successful');
            } catch (err) {
              console.log('Universal provider disconnect failed:', err);
            }
          }
          
        } catch (error) {
          console.warn('WalletConnect disconnect warning:', error);
        }
      }
      
      // 4. Clear all local state
      setUser(null);
      setWcConnected(false);
      setWcProvider(null);
      setWcChainId(null);
      setWcAddress(null);
      setError(null);
      
      console.log('Logout completed successfully');
      
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setWcConnected(false);
      setWcProvider(null);
      setWcChainId(null);
      setWcAddress(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  // Check NFT ownership using ethers.js
  const checkNFTOwnership = async (walletAddress: string): Promise<boolean> => {
    try {
      // This is a placeholder - you'll need to implement actual NFT checking
      // against your TNT-721 contracts
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/nfts/of?wallet=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        return data.data.nfts.length > 0;
      }
      return false;
    } catch (error) {
      console.error('NFT check error:', error);
      return false;
    }
  };

  // Get CSRF token for API calls
  const getCSRFToken = async (): Promise<string> => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/session/csrf`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.data.token;
      }
      return '';
    } catch (error) {
      console.error('CSRF token error:', error);
      return '';
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    error,
    isMagicReady: !!magic,
    isWalletConnected,
    loginWithThetaPass,
    loginWithMagic,
    loginWithWalletConnect,
    loginWithSIWE,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
