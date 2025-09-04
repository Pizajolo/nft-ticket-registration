"use client";

import { useState, useRef } from 'react';
import { QrScanner } from '@yudiel/react-qr-scanner';

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
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTicketFound: (registration: Registration) => void;
}

export function QRScannerModal({ isOpen, onClose, onTicketFound }: QRScannerModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleScan = async (result: string) => {
    if (!result || isProcessing) return;
    
    setIsProcessing(true);
    setError(null);
    
    // Show success message briefly
    setError(null);
    
    try {
      let ticketId: string;
      
      // Try to parse as JSON first (our ticket format)
      try {
        const qrData = JSON.parse(result);
        if (qrData.t === 'eucon' && qrData.ticketId) {
          ticketId = qrData.ticketId;
        } else {
          throw new Error('Invalid QR format');
        }
      } catch (parseError) {
        // If not JSON, try to extract from URL or use as direct ticketId
        if (result.startsWith('http')) {
          const url = new URL(result);
          ticketId = url.pathname.split('/').pop() || result;
        } else {
          ticketId = result;
        }
      }
      
      // Fetch ticket information from the backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/registrations/by-ticket/${ticketId}`,
        { credentials: 'include' }
      );
      
      if (response.ok) {
        const data = await response.json();
        console.log('Backend response:', JSON.stringify(data, null, 2));
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        console.log('Data object keys:', Object.keys(data));
        console.log('Data.data object keys:', Object.keys(data.data || {}));
        console.log('Data.data.registration exists:', !!data.data?.registration);
        console.log('Data.data.registration type:', typeof data.data?.registration);
        
        if (data.data?.registration) {
          console.log('Registration data found:', JSON.stringify(data.data.registration, null, 2));
          console.log('Registration ID:', data.data.registration.id);
          console.log('Registration ticketId:', data.data.registration.ticketId);
          
          if (data.data.registration.id && data.data.registration.ticketId) {
            setSuccessMessage('Ticket found! Loading details...');
            setTimeout(() => {
              console.log('Calling onTicketFound with:', data.data.registration);
              onTicketFound(data.data.registration);
            }, 1000); // Show success message for 1 second
          } else {
            console.error('Registration missing required fields:', {
              id: data.data.registration.id,
              ticketId: data.data.registration.ticketId
            });
            setError('Registration data incomplete');
          }
        } else {
          console.error('No registration data in response:', JSON.stringify(data, null, 2));
          setError('Invalid response format from server');
        }
      } else {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        setError('Ticket not found or invalid QR code');
      }
    } catch (error) {
      setError('Failed to process QR code');
      console.error('QR scan error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: any) => {
    console.error('QR Scanner error:', error);
    setError('Failed to access camera');
  };

  const startScanning = () => {
    setIsScanning(true);
    setError(null);
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal content */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  QR Code Scanner
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Scan a ticket QR code to view registration details
                  </p>
                </div>
              </div>
            </div>

            {/* Scanner Controls */}
            <div className="mt-4 flex justify-center space-x-3">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Scanner
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Stop Scanner
                </button>
              )}
            </div>

            {/* Success Display */}
            {successMessage && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-3">
                <div className="text-sm text-green-800">{successMessage}</div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mt-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-600 mt-2">Processing QR code...</p>
              </div>
            )}

            {/* QR Scanner */}
            {isScanning && (
              <div className="mt-4">
                <div className="relative overflow-hidden" style={{ borderRadius: '10px' }}>
                  <QrScanner
                    onDecode={handleScan}
                    onError={handleError}
                    constraints={{
                      facingMode: 'environment', // Use back camera on mobile
                    }}
                    videoStyle={{
                      width: '100%',
                      height: '640px',
                      objectFit: 'cover',
                      borderRadius: '12px',
                    }}
                    // videoStyle={{
                    //   width: '100%',
                    //   height: '400px',
                    //   objectFit: 'cover',
                    //   borderRadius: '12px',
                    // }}
                    // containerStyle={{
                    //   width: '100%',
                    //   height: '400px',
                    //   borderRadius: '12px',
                    // }}
                  />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-500 border-opacity-50 rounded-lg"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 border-2 border-blue-500 border-opacity-75 rounded-lg"></div>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Position the QR code within the frame
                </p>
              </div>
            )}
          </div>

          {/* Modal footer */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
