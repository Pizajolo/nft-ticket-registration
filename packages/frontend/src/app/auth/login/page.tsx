'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const { user, isLoading, error, clearError, isMagicReady, isWalletConnected, loginWithThetaPass, loginWithMagic, loginWithWalletConnect } = useAuth();
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<'thetapass' | 'magic' | 'walletconnect' | null>(null);
  const [email, setEmail] = useState('');
  const [showMagicForm, setShowMagicForm] = useState(false);

  // Redirect if already authenticated
  if (user?.isAuthenticated) {
    router.push('/dashboard');
    return null;
  }

  const handleMethodSelect = (method: 'thetapass' | 'magic' | 'walletconnect') => {
    setSelectedMethod(method);
    clearError();
    
    if (method === 'magic') {
      setShowMagicForm(true);
    } else {
      setShowMagicForm(false);
    }
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setShowMagicForm(false);
    setEmail('');
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            THETA EuroCon
          </h1>
          <p className="text-gray-600">
            NFT Registration & Check-in System
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {!selectedMethod ? (
            // Method Selection
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Choose Login Method
                </h2>
                <p className="text-gray-600">
                  Select how you'd like to authenticate
                </p>
              </div>

              {/* ThetaPass */}
              <button
                onClick={() => handleMethodSelect('thetapass')}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-200"
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <img src="/images/theta-logo.png" alt="ThetaPass" className="w-6 h-6 rounded-full" />
                </div>
                ThetaPass (ThetaDrop)
              </button>

              {/* Magic Link */}
              <button
                onClick={() => handleMethodSelect('magic')}
                disabled={!isMagicReady}
                className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg transition-all duration-200 ${
                  isMagicReady 
                    ? 'text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500' 
                    : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                }`}
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <img src="/images/magic-logo.png" alt="Magic Link" className="w-6 h-6 rounded-full" />
                </div>
                Magic Link (Email) {!isMagicReady && '(Loading...)'}
              </button>

              {/* Wallet Connect */}
              <button
                onClick={() => handleMethodSelect('walletconnect')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  <img src="/images/wallet-connect-logo.png" alt="Wallet Connect" className="w-6 h-6 rounded-full" />
                </div>
                Wallet Connect
              </button>

              
            </div>
          ) : (
            // Method-specific UI
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedMethod === 'thetapass' && 'ThetaPass Login'}
                  {selectedMethod === 'magic' && 'Magic Link Login'}
                  {selectedMethod === 'walletconnect' && 'Wallet Connect Login'}
                </h2>
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Method-specific Content */}
              {selectedMethod === 'thetapass' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Connect your ThetaDrop managed wallet to access your NFTs
                  </p>
                  <button
                    onClick={loginWithThetaPass}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      'Connect ThetaPass'
                    )}
                  </button>
                </div>
              )}

              {selectedMethod === 'magic' && (
                <div className="space-y-4">
                  {!isMagicReady ? (
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600">Initializing Magic SDK...</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600">
                        Enter your email to receive a magic link
                      </p>
                                            <form onSubmit={(e) => { e.preventDefault(); loginWithMagic(email); }} className="space-y-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your@email.com"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isLoading || !email}
                          className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                              Sending...
                            </div>
                          ) : (
                            'Send Magic Link'
                          )}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {selectedMethod === 'walletconnect' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    Connect your wallet using WalletConnect to access your NFTs
                  </p>
                  <button
                    onClick={loginWithWalletConnect}
                    disabled={isLoading || (user?.isAuthenticated && user.type === 'walletconnect')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      !isWalletConnected
                        ? 'Connect Wallet'
                        : !user?.isAuthenticated
                          ? 'Sign message'
                          : 'Connected'
                    )}
                  </button>
                </div>
              )}

              
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link 
            href="/"
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
