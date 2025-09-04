"use client";

import { useState, useEffect } from 'react';

interface Registration {
  id: string;
  wallet: string;
  nft: {
    contract: string;
    tokenId: string;
    contractName?: string;
  };
  firstName: string;
  lastName: string;
  email: string;
  method: string;
  verifiedAt: string;
  ticketId: string;
  checkedInAt?: string;
  notes?: string;
  verification?: {
    isStillOwned: boolean;
    currentOwner: string;
    differences: Array<{
      type: string;
      field: string;
      oldValue: string;
      newValue: string;
      message: string;
    }>;
  };
}

interface ScannedTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  onCheckIn: (registrationId: string) => Promise<void>;
  onEdit: (registration: Registration) => void;
  onScanNext: () => void;
}

interface ScannedTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: Registration | null;
  onCheckIn: (registrationId: string) => Promise<void>;
  onEdit: (registration: Registration) => void;
  onScanNext: () => void;
}

export function ScannedTicketModal({ 
  isOpen, 
  onClose, 
  registration, 
  onCheckIn, 
  onEdit,
  onScanNext
}: ScannedTicketModalProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [showNFTDetails, setShowNFTDetails] = useState(false);

  // Reset state when modal opens with new registration
  useEffect(() => {
    if (isOpen && registration) {
      setIsCheckedIn(false);
    }
  }, [isOpen, registration]);

  if (!isOpen || !registration) return null;

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    try {
      await onCheckIn(registration.id);
      // Set the checked in state to show success message and new buttons
      setIsCheckedIn(true);
      console.log('Check-in completed, isCheckedIn set to:', true);
      
      // Update the local registration object to reflect the action performed
      // If it was checked in, now it's checked out, and vice versa
      if (!registration.checkedInAt) {
        // Was not checked in, now it is
        registration.checkedInAt = new Date().toISOString();
      } else {
        // Was checked in, now it's checked out
        registration.checkedInAt = undefined;
      }
    } catch (error) {
      console.error('Check-in failed:', error);
    } finally {
      setIsCheckingIn(false);
    }
  };

  const handleEdit = () => {
    onEdit(registration);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            
            {/* Header with Status */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {registration.firstName} {registration.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Ticket #{registration.ticketId.slice(0, 8)}...
                  </p>
                </div>
                
                {/* Status Badge */}
                <div className="text-right">
                  {registration.checkedInAt ? (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                      Already Checked In
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Ready to Check In
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Verification Status - Top Priority */}
            {registration.verification && (
              <div className={`mb-6 p-4 rounded-lg border ${
                registration.verification.isStillOwned && registration.verification.differences.length === 0
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {registration.verification.isStillOwned && registration.verification.differences.length === 0 ? (
                      <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className={`text-sm font-medium ${
                      registration.verification.isStillOwned && registration.verification.differences.length === 0
                        ? 'text-green-800'
                        : 'text-red-800'
                    }`}>
                      {registration.verification.isStillOwned && registration.verification.differences.length === 0
                        ? '✅ QR Code Data Matches Database'
                        : '❌ QR Code Data Mismatch Detected'
                      }
                    </h4>
                    {registration.verification.differences.length > 0 && (
                      <div className="mt-2 text-sm text-red-700">
                        {registration.verification.differences.map((diff, index) => (
                          <p key={index} className="text-xs">
                            {diff.message}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Email</h4>
                <div className="text-sm text-gray-900">{registration.email}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Verification Method</h4>
                <div className="text-sm text-gray-900 capitalize">{registration.method}</div>
              </div>
            </div>

            {/* NFT Information - Collapsible */}
            <div className="mb-6">
              <button
                onClick={() => setShowNFTDetails(!showNFTDetails)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">NFT Information</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transform transition-transform ${showNFTDetails ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showNFTDetails && (
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Contract:</span>
                      <div className="font-medium text-gray-900">
                        {registration.nft.contractName || 'Unknown Contract'}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {registration.nft.contract.slice(0, 6)}...{registration.nft.contract.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Token ID:</span>
                      <div className="font-medium text-gray-900">#{registration.nft.tokenId}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Registered Wallet:</span>
                      <div className="font-medium text-gray-900 font-mono">
                        {registration.wallet.slice(0, 6)}...{registration.wallet.slice(-4)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Verified At:</span>
                      <div className="text-sm text-gray-900">
                        {new Date(registration.verifiedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {registration.notes && (
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <div className="text-sm text-gray-900">{registration.notes}</div>
              </div>
            )}


          </div>

          {/* Modal footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6">
            {/* Main Action Button - Toggle between Check In and Check Out */}
            {!isCheckedIn && (
              <div className="mb-3 sm:mb-0">
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className={`w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-6 py-3 text-lg font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    registration.checkedInAt 
                      ? 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500' 
                      : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  }`}
                >
                  {isCheckingIn ? 'Processing...' : (registration.checkedInAt ? 'CHECK OUT' : 'CHECK IN')}
                </button>
              </div>
            )}

            {/* Scan Next Button - Always Visible */}
            <div className="mb-3 sm:mb-0 pt-3">
              <button
                type="button"
                onClick={onScanNext}
                className="w-full inline-flex items-center justify-center rounded-md border border-transparent shadow-sm px-6 py-3 bg-blue-600 text-lg font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Scan Next Ticket
              </button>
            </div>

            {/* Success Message After Action */}
            {isCheckedIn && (
              <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-green-800">
                      Successfully {registration.checkedInAt ? 'Checked In!' : 'Checked Out!'}
                    </h4>
                    <p className="text-sm text-green-700 mt-1">
                      The attendee has been {registration.checkedInAt ? 'checked in' : 'checked out'}.
                    </p>
                  </div>
                </div>
              </div>
            )}


            {/* Secondary Action Buttons */}
            <div className="space-y-3 sm:space-y-0 sm:space-x-3 sm:flex sm:justify-between py-3">
              {/* Edit Button */}
              <button
                type="button"
                onClick={handleEdit}
                className="w-full sm:w-1/2 inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>

              {/* Close Button (only show when not checked in) */}
              {!isCheckedIn && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-1/2 inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
