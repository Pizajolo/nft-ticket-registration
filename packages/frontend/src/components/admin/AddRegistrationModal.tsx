"use client";

import { useState, useEffect } from 'react';
import { NFT } from '@/types/nft';

interface Contract {
  address: string;
  name: string;
  symbol?: string;
}

interface AddRegistrationModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddRegistrationModal({ onClose, onSuccess }: AddRegistrationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [walletNFTs, setWalletNFTs] = useState<NFT[]>([]);
  const [isLoadingNFTs, setIsLoadingNFTs] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    wallet: '',
    contract: '',
    tokenId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: [{
            nft: {
              contract: formData.contract,
              tokenId: formData.tokenId,
            },
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            method: 'admin',
          }],
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to create registration');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch available contracts on component mount
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/contracts`, {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setContracts(data.data.contracts);
        }
      } catch (error) {
        console.error('Failed to fetch contracts:', error);
      }
    };
    
    fetchContracts();
  }, []);

  // Fetch NFTs when wallet changes
  const fetchWalletNFTs = async (wallet: string) => {
    if (!wallet || !wallet.match(/^0x[a-fA-F0-9]{40}$/)) {
      setWalletNFTs([]);
      return;
    }
    
    setIsLoadingNFTs(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/wallet-nfts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ wallet }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletNFTs(data.data.nfts);
      }
    } catch (error) {
      console.error('Failed to fetch wallet NFTs:', error);
      setWalletNFTs([]);
    } finally {
      setIsLoadingNFTs(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // If wallet changes, fetch NFTs
    if (field === 'wallet') {
      fetchWalletNFTs(value);
    }
    
    // If contract changes, clear tokenId
    if (field === 'contract') {
      setFormData(prev => ({ ...prev, tokenId: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Add New Registration</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
                              <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
            </div>

            <div>
              <label htmlFor="wallet" className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address *
              </label>
                              <input
                  type="text"
                  id="wallet"
                  required
                  value={formData.wallet}
                  onChange={(e) => handleInputChange('wallet', e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900"
                />
            </div>

            <div>
              <label htmlFor="contract" className="block text-sm font-medium text-gray-700 mb-1">
                NFT Contract *
              </label>
              <select
                id="contract"
                required
                value={formData.contract}
                onChange={(e) => handleInputChange('contract', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="">Select a contract</option>
                {contracts.map((contract) => (
                  <option key={contract.address} value={contract.address}>
                    {contract.name} ({contract.symbol || 'No Symbol'}) - {contract.address.slice(0, 6)}...{contract.address.slice(-4)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tokenId" className="block text-sm font-medium text-gray-700 mb-1">
                Token ID *
              </label>
              {formData.wallet && formData.contract ? (
                <select
                  id="tokenId"
                  required
                  value={formData.tokenId}
                  onChange={(e) => handleInputChange('tokenId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="">Select a token ID</option>
                  {isLoadingNFTs ? (
                    <option disabled>Loading tokens...</option>
                  ) : walletNFTs.length > 0 ? (
                    walletNFTs
                      .filter(nft => nft.contract.toLowerCase() === formData.contract.toLowerCase())
                      .map((nft) => (
                        <option key={`${nft.contract}-${nft.tokenId}`} value={nft.tokenId}>
                          Token #{nft.tokenId} - {nft.contractName}
                        </option>
                      ))
                  ) : (
                    <option disabled>No tokens found for this wallet and contract</option>
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  id="tokenId"
                  required
                  value={formData.tokenId}
                  onChange={(e) => handleInputChange('tokenId', e.target.value)}
                  placeholder="Enter token ID manually or select wallet and contract first"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              )}
              {formData.wallet && formData.contract && walletNFTs.length === 0 && !isLoadingNFTs && (
                <p className="text-sm text-gray-500 mt-1">
                  No tokens found for this wallet and contract combination.
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating...' : 'Create Registration'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
