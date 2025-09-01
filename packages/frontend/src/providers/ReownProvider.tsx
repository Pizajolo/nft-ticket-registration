'use client';

import React from 'react';
import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { theta as thetaNetwork, AppKitNetwork } from '@reown/appkit/networks';

/**
 * Minimal Reown AppKit initializer for Ethers + Theta.
 * Initialize at module scope (client-only) so hooks are safe on first render.
 */
if (typeof window !== 'undefined' && !(window as any).__REOWN_APPKIT_INITIALIZED__) {
  try {
    const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '';
    const networks = [thetaNetwork] as [AppKitNetwork, ...AppKitNetwork[]];
    const appkit = createAppKit({
      adapters: [new EthersAdapter()],
      networks,
      projectId,
      metadata: {
        name: 'THETA EuroCon NFT Registration',
        description: 'Register your NFTs for THETA EuroCon',
        url: window.location.origin,
        icons: ['https://opentheta.io/favicon.ico'],
      },
      features: {
        analytics: true,
        swaps: false,
        onramp: false,
        email: false,
        connectMethodsOrder: ["wallet"]
      },
      featuredWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // Metamask
        "43832260665ea0d076f9af1ee157d580bb0eb44ca0415117fef65666460a2652", // Theta Wallet
      ],
      includeWalletIds: [
        "c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96", // Metamask
        "43832260665ea0d076f9af1ee157d580bb0eb44ca0415117fef65666460a2652", // Theta Wallet
        "4622a2b2d6af1c538494a340e3d8c1d3", // WalletConnect
      ],
      universalProviderConfigOverride: {
        rpcMap: { 'eip155:361': process.env.NEXT_PUBLIC_THETA_RPC_URL || 'https://eth-rpc-api.thetatoken.org' },
        defaultChain: 'eip155:361',
      },
    });
    ;(window as any).__REOWN_APPKIT_INITIALIZED__ = true;
    ;(window as any).__REOWN_APPKIT__ = appkit;
  } catch (err) {
    console.warn('Reown AppKit init warning:', err);
  }
}

export const ReownProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default ReownProvider;


