"use client";

import { useState } from 'react';
import { ethers } from 'ethers';
import Link from 'next/link';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [loginMethod, setLoginMethod] = useState<'password' | 'wallet'>('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Wallet login state
  const [wallet, setWallet] = useState('');
  const [nonce, setNonce] = useState('');
  const [message, setMessage] = useState('');
  const [signature, setSignature] = useState('');

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        onLoginSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get nonce
      const nonceResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login/wallet/nonce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce');
      }

      const nonceData = await nonceResponse.json();
      setNonce(nonceData.data.nonce);
      setMessage(nonceData.data.message);

      // Step 2: Request signature from user
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const signer = await provider.getSigner();
        const signatureResult = await signer.signMessage(nonceData.data.message);
        setSignature(signatureResult);

        // Step 3: Verify signature
        const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/login/wallet/siwe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            wallet,
            signature: signatureResult,
            message: nonceData.data.message,
          }),
        });

        if (verifyResponse.ok) {
          onLoginSuccess();
        } else {
          const data = await verifyResponse.json();
          setError(data.message || 'Signature verification failed');
        }
      } else {
        setError('MetaMask not found. Please install MetaMask.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Wallet login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Portal
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            THETA EuroCon Event Management
          </p>
        </div>

        {/* Login Method Tabs */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-white">
          <button
            onClick={() => setLoginMethod('password')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMethod === 'password'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setLoginMethod('wallet')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
              loginMethod === 'wallet'
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Wallet
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {/* Password Login Form */}
        {loginMethod === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter Email..."
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        )}

        {/* Wallet Login Form */}
        {loginMethod === 'wallet' && (
          <form className="mt-8 space-y-6" onSubmit={handleWalletLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="wallet" className="block text-sm font-medium text-gray-700">
                  Wallet Address
                </label>
                <input
                  id="wallet"
                  name="wallet"
                  type="text"
                  required
                  value={wallet}
                  onChange={(e) => setWallet(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-900"
                  placeholder="0x..."
                />
              </div>
              
              {nonce && (
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="text-sm text-gray-600 mb-2">Message to sign:</div>
                  <div className="text-xs font-mono bg-white p-2 rounded border break-all">
                    {message}
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !wallet}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Connect Wallet & Sign'}
            </button>
          </form>
        )}

        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            ← Back to main site
          </Link>
        </div>
      </div>
    </div>
  );
}
