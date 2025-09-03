"use client";

import { toPng } from "html-to-image";
import { useRef, useEffect, useState } from "react";
import QRCode from "qrcode";

export function TicketCard({ qrPayload, firstName, lastName, tokenId }: {
  qrPayload: string; 
  firstName: string; 
  lastName: string; 
  tokenId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
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
      }
    };

    if (qrPayload) {
      generateQR();
    }
  }, [qrPayload]);

  const downloadPng = async () => {
    if (!ref.current) return;
    try {
      const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `ticket_${tokenId}.png`;
      a.click();
    } catch (error) {
      console.error('Failed to generate ticket image:', error);
    }
  };

  return (
    <div 
      className="rounded-2xl shadow-lg p-6 w-80 border border-gray-200 relative overflow-hidden" 
      ref={ref}
      style={{
        backgroundImage: 'url(/images/ticket-background.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-10 z-0 pointer-events-none"></div>
      {/* Content with relative positioning */}
      <div className="relative z-10">
        <div className="text-center mb-4">
          <div className="mb-1">
            <h3 className="text-lg font-bold text-black bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow">
              THETA EuroCon
            </h3>
          </div>
          <div>
            <span className="text-sm text-gray-600 bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow">
              NFT Ticket
            </span>
          </div>
        </div>
      
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
      ) : (
        <div className="w-48 h-48 mx-auto border-2 border-white bg-white bg-opacity-20 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}
      
      <div className="mt-4 text-center">
        <div className="flex flex-col items-center">
          <div className="font-semibold text-lg text-black bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow min-h-[2.5rem] flex items-center justify-center">
            {firstName} {lastName}
          </div>
          <div className="text-sm text-gray-600 mt-1 bg-white bg-opacity-100 rounded-lg px-3 py-1 inline-block shadow min-h-[1.75rem] flex items-center justify-center">
            Token #{tokenId}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="text-xs text-blue-100">Scan QR code for verification</div>
      </div>
      
      <button 
        onClick={downloadPng} 
        className="mt-4 w-full rounded-xl border-2 border-white py-2 text-white hover:bg-white hover:text-blue-900 transition-colors font-medium"
      >
        Download PNG
      </button>
      </div>
    </div>
  );
}
