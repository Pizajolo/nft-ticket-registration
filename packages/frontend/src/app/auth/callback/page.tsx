'use client';

import React, { useEffect } from 'react';
import * as ThetaPass from '@thetalabs/theta-pass';

async function getCSRF(): Promise<string> {
  try {
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const r = await fetch(`${api}/api/session/csrf`, { credentials: 'include' });
    if (!r.ok) return '';
    const j = await r.json();
    return j?.data?.token || '';
  } catch {
    return '';
  }
}

export default function AuthCallbackPage() {
  useEffect(() => {
    (async () => {
      try {
        // Required by ThetaPass
        window.localStorage.setItem('theta-pass.request-callback-url', window.location.href);
        window.localStorage.removeItem('theta-pass.request-callback-url');

        // Read response from ThetaPass
        const resp: any = await (ThetaPass as any).getResponse();
        const reqMethod = resp?.request?.method || '';
        const result = resp?.result || [];

        // Helper to finish login
        const finishLogin = async (wallet: string, signature?: string, message?: string) => {
          const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
          if (!message) {
            // fetch nonce/message
            const nonceR = await fetch(`${api}/api/session/nonce`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ wallet })
            });
            if (!nonceR.ok) throw new Error('Failed to get nonce');
            const nonceJ = await nonceR.json();
            message = nonceJ?.data?.message;
          }

          if (!signature) {
            // Ask ThetaPass to sign (popup or redirect)
            const signR: any = await (ThetaPass as any).signMessage(message, window.location.href, null, true);
            const signRes: any = signR?.result || {};
            signature = signRes?.signature || signRes?.[1];
            if (!signature) throw new Error('No signature from ThetaPass');
          }

          const csrf = await getCSRF();
          const siwe = await fetch(`${api}/api/session/siwe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
            credentials: 'include',
            body: JSON.stringify({ wallet, signature, message })
          });
          if (!siwe.ok) throw new Error('Failed to create session');
          window.location.replace('/dashboard');
        };

        if (reqMethod === 'eth_sign' && (result?.signature || result?.[1])) {
          // Coming back from a sign
          const wallet = result?.address || result?.[0];
          const signature = result?.signature || result?.[1];
          // message already known to ThetaPass; re-fetch nonce just to be safe
          await finishLogin(wallet, signature);
          return;
        }

        if (reqMethod === 'eth_requestAccounts' && result?.[0]) {
          // We have a wallet; proceed to sign then SIWE
          await finishLogin(result[0]);
          return;
        }

        // Fallback: go back to login
        window.location.replace('/auth/login');
      } catch (e) {
        window.location.replace('/auth/login');
      } finally {
        // Close only if this was a popup
        try { if (window.opener) window.close(); } catch {}
      }
    })();
  }, []);

  return null;
}
