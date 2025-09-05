"use client";

import { useState } from 'react';
import { toPng } from "html-to-image";
import QRCode from "qrcode";

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

interface TicketDetailsModalProps {
  registration: Registration;
  onClose: () => void;
  onCheckIn: () => void;
  onEdit: () => void;
}

export function TicketDetailsModal({ registration, onClose, onCheckIn, onEdit }: TicketDetailsModalProps) {
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

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

  const generateQRCode = async () => {
    if (qrDataUrl) return; // Already generated
    
    setIsGeneratingQR(true);
    try {
      // Use the exact QR payload format from the database
      // The payload should be the raw JSON string, not a JSON.stringify of an object
      const qrPayload = `{"t":"eucon","v":1,"ticketId":"${registration.ticketId}","nft":{"contract":"${registration.nft.contract}","tokenId":"${registration.nft.tokenId}"}}`;

      const dataUrl = await QRCode.toDataURL(qrPayload, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      setError('Failed to generate QR code');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const downloadTicketPNG = async () => {
    if (!qrDataUrl) {
      await generateQRCode();
      return;
    }

    try {
      // Create a temporary ticket card element with proper React structure
      const ticketElement = document.createElement('div');
      ticketElement.className = 'rounded-2xl shadow-lg p-6 w-80 border border-gray-200 relative overflow-hidden';
      ticketElement.style.backgroundImage = 'url(/images/ticket-background.png)';
      ticketElement.style.backgroundSize = 'cover';
      ticketElement.style.backgroundPosition = 'center';
      ticketElement.style.backgroundRepeat = 'no-repeat';

      // Create the overlay
      const overlay = document.createElement('div');
      overlay.className = 'absolute inset-0 bg-black bg-opacity-10 z-0 pointer-events-none';
      ticketElement.appendChild(overlay);

      // Create the content container
      const content = document.createElement('div');
      content.className = 'relative z-10';
      ticketElement.appendChild(content);

      // Create header section
      const header = document.createElement('div');
      header.className = 'text-center mb-4';
      
      const titleContainer = document.createElement('div');
      titleContainer.className = 'mb-1';
      
      const title = document.createElement('h3');
      title.className = 'text-lg font-bold text-black bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow';
      title.textContent = 'THETA EuroCon';
      titleContainer.appendChild(title);
      header.appendChild(titleContainer);

      const subtitleContainer = document.createElement('div');
      const subtitle = document.createElement('span');
      subtitle.className = 'text-sm text-gray-600 bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow';
      subtitle.textContent = 'NFT Ticket';
      subtitleContainer.appendChild(subtitle);
      header.appendChild(subtitleContainer);

      content.appendChild(header);

      // Create QR code
      const qrImg = document.createElement('img');
      qrImg.src = qrDataUrl;
      qrImg.alt = 'QR Code';
      qrImg.className = 'w-48 h-48 mx-auto rounded-lg';
      content.appendChild(qrImg);

      // Create name section
      const nameSection = document.createElement('div');
      nameSection.className = 'mt-4 text-center';
      
      const nameContainer = document.createElement('div');
      nameContainer.className = 'flex flex-col items-center';
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'font-semibold text-lg text-black bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow min-h-[2.5rem] flex items-center justify-center';
      nameDiv.textContent = `${registration.firstName} ${registration.lastName}`;
      nameContainer.appendChild(nameDiv);
      
      const tokenDiv = document.createElement('div');
      tokenDiv.className = 'text-sm text-gray-600 mt-1 bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow min-h-[1.75rem] flex items-center justify-center';
      tokenDiv.textContent = `Token #${registration.nft.tokenId}`;
      nameContainer.appendChild(tokenDiv);
      
      nameSection.appendChild(nameContainer);
      content.appendChild(nameSection);

      // Create footer
      const footer = document.createElement('div');
      footer.className = 'mt-4 text-center';
      
      const footerText = document.createElement('div');
      footerText.className = 'text-xs text-blue-100';
      footerText.textContent = 'Scan QR code for verification';
      footer.appendChild(footerText);
      content.appendChild(footer);

      // Create Download PNG button (same as original)
      const downloadButton = document.createElement('button');
      downloadButton.className = 'mt-4 w-full rounded-xl border-2 border-white py-2 text-white hover:bg-white hover:text-blue-900 transition-colors font-medium';
      downloadButton.textContent = 'Download PNG';
      content.appendChild(downloadButton);

      // Append to body temporarily
      document.body.appendChild(ticketElement);

      // Generate PNG with transparent background to preserve rounded corners
      const dataUrl = await toPng(ticketElement, { 
        cacheBust: true, 
        pixelRatio: 2,
        backgroundColor: undefined // Transparent background
      });

      // Download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `ticket_${registration.nft.tokenId}_${registration.firstName}_${registration.lastName}.png`;
      a.click();

      // Clean up
      document.body.removeChild(ticketElement);
    } catch (error) {
      console.error('Failed to generate ticket image:', error);
      setError('Failed to generate ticket image');
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
              onClick={downloadTicketPNG}
              disabled={isGeneratingQR}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingQR ? 'Generating...' : 'Download PNG'}
            </button>
            
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
