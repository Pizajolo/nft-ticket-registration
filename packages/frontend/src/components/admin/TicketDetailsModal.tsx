"use client";

import { useState } from 'react';

interface Registration {
  id: string;
  wallet: string;
  nft: {
    contract: string;
    tokenId: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  method: string;
  verifiedAt: string;
  ticketId: string;
  checkedInAt?: string;
  notes?: string;
}

interface TicketDetailsModalProps {
  registration: Registration;
  onClose: () => void;
  onCheckIn: () => void;
  onEdit: () => void;
}

export function TicketDetailsModal({ registration, onClose, onCheckIn, onEdit }: TicketDetailsModalProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    setError(null);
    
    try {
      await onCheckIn();
    } catch (error) {
      setError('Check-in failed. Please try again.');
    } finally {
      setIsCheckingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Ticket Details</h3>
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

          {/* Ticket Information */}
          <div className="space-y-4">
            {/* Attendee Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Attendee Information</h4>
              <div className="space-y-1 text-sm text-gray-900">
                <div><span className="font-medium">Name:</span> {registration.firstName} {registration.lastName}</div>
                <div><span className="font-medium">Email:</span> {registration.email}</div>
              </div>
            </div>

            {/* NFT Info */}
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">NFT Information</h4>
              <div className="space-y-1 text-sm text-gray-900">
                <div><span className="font-medium">Token ID:</span> {registration.nft.tokenId}</div>
                <div><span className="font-medium">Contract Name:</span> {registration.nft.contractName || 'Unknown'}</div>
                <div><span className="font-medium">Contract Address:</span> 
                  <span className="font-mono text-xs ml-1 text-gray-900">
                    {registration.nft.contract.slice(0, 6)}...{registration.nft.contract.slice(-4)}
                  </span>
                </div>
                <div><span className="font-medium">Wallet:</span> 
                  <span className="font-mono text-xs ml-1 text-gray-900">
                    {registration.wallet.slice(0, 6)}...{registration.wallet.slice(-4)}
                  </span>
                </div>
              </div>
            </div>

            {/* Registration Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Registration Details</h4>
              <div className="space-y-1 text-sm text-gray-900">
                <div><span className="font-medium">Ticket ID:</span> {registration.ticketId}</div>
                <div><span className="font-medium">Method:</span> {registration.method}</div>
                <div><span className="font-medium">Verified:</span> {new Date(registration.verifiedAt).toLocaleDateString()}</div>
                {registration.checkedInAt && (
                  <div><span className="font-medium">Checked In:</span> {new Date(registration.checkedInAt).toLocaleDateString()}</div>
                )}
                {registration.notes && (
                  <div><span className="font-medium">Notes:</span> {registration.notes}</div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="p-4 rounded-lg border">
              <h4 className="font-medium text-gray-900 mb-2">Status</h4>
              <div className="flex items-center">
                {registration.checkedInAt ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✅ Checked In
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    ⏳ Pending Check-in
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6">
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Edit
            </button>
            
            {!registration.checkedInAt ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCheckingIn ? 'Checking In...' : 'Check In'}
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
