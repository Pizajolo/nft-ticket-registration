'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type NFT = { contract: string; tokenId: string; name?: string };

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  method: 'sign' | 'transfer';
};

type FormState = {
  open: boolean;
  data: FormData;
  valid: boolean;
};

function keyOf(nft: NFT): string {
  return `${nft.contract}:${nft.tokenId}`;
}

async function getCSRFToken(): Promise<string> {
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

export default function RegisterPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [nfts, setNfts] = React.useState<NFT[]>([]);
  const [forms, setForms] = React.useState<Record<string, FormState>>({});
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [submitMsg, setSubmitMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!user?.isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const r = await fetch(`${api}/api/nfts/of`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ wallet: user.wallet }),
        });
        if (!r.ok) throw new Error('Failed to load NFTs');
        const j = await r.json();
        const items: NFT[] = Array.isArray(j?.data?.nfts) ? j.data.nfts : [];
        setNfts(items);
        // Initialize form states
        const init: Record<string, FormState> = {};
        items.forEach((n: any) => {
          init[keyOf(n)] = {
            open: false,
            valid: Boolean(n?.existing?.firstName && n?.existing?.lastName && n?.existing?.email),
            data: {
              firstName: n?.existing?.firstName || '',
              lastName: n?.existing?.lastName || '',
              email: n?.existing?.email || '',
              method: 'sign',
            },
          };
        });
        setForms(init);
      } catch (e: any) {
        setError(e?.message || 'Failed to load NFTs');
      } finally {
        setLoading(false);
      }
    })();
  }, [user, router]);

  const toggleForm = (nft: NFT) => {
    const k = keyOf(nft);
    setForms((prev) => ({ ...prev, [k]: { ...prev[k], open: !prev[k]?.open } }));
  };

  const updateField = (nft: NFT, field: keyof FormData, value: string) => {
    const k = keyOf(nft);
    setForms((prev) => {
      const cur = prev[k];
      const nextData = { ...cur.data, [field]: value } as FormData;
      const valid =
        nextData.firstName.trim().length > 0 &&
        nextData.lastName.trim().length > 0 &&
        /.+@.+\..+/.test(nextData.email) &&
        (nextData.method === 'sign' || nextData.method === 'transfer');
      return { ...prev, [k]: { ...cur, data: nextData, valid } };
    });
  };

  const submit = async () => {
    try {
      setSubmitting(true);
      setSubmitMsg(null);
      setError(null);
      // Collect completed forms
      const items = Object.entries(forms)
        .filter(([, st]) => st.valid)
        .map(([k, st]) => {
          const [contract, tokenId] = k.split(':');
          return {
            nft: { contract, tokenId },
            firstName: st.data.firstName.trim(),
            lastName: st.data.lastName.trim(),
            email: st.data.email.trim(),
            method: st.data.method,
          };
        });
      if (items.length === 0) {
        setError('Please fill out at least one NFT form correctly.');
        setSubmitting(false);
        return;
      }
      const csrf = await getCSRFToken();
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const r = await fetch(`${api}/api/registration/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
        credentials: 'include',
        body: JSON.stringify({ items }),
      });
      const j = await r.json();
      if (!r.ok || j?.success !== true) throw new Error(j?.error || 'Failed to submit');
      setSubmitMsg(j?.data?.message || 'Submitted successfully');
      
      // Update local NFT state to mark them as registered
      setNfts(prevNfts => 
        prevNfts.map(nft => {
          const k = keyOf(nft);
          const formState = forms[k];
          if (formState?.valid) {
            return {
              ...nft,
              existing: {
                firstName: formState.data.firstName,
                lastName: formState.data.lastName,
                email: formState.data.email
              }
            };
          }
          return nft;
        })
      );
    } catch (e: any) {
      setError(e?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <button onClick={() => router.push('/dashboard')} className="text-blue-600 hover:text-blue-800 text-sm">← Back</button>
              <h1 className="text-xl font-bold text-gray-900">Register your NFTs</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user?.wallet && (
                <span className="text-sm text-gray-500">
                  Connected: {user.wallet.slice(0, 6)}...{user.wallet.slice(-4)}
                </span>
              )}
              <button
                onClick={async () => { await logout(); router.push('/'); }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        {loading && (
          <div className="text-gray-600">Loading your NFTs...</div>
        )}
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>
        )}
        {submitMsg && (
          <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">{submitMsg}</div>
        )}

        {!loading && nfts.length === 0 && (
          <div className="text-gray-600">No eligible NFTs found for {user?.wallet}.</div>
        )}

        <div className="space-y-4">
          {nfts.map((nft) => {
            const k = keyOf(nft);
            const st = forms[k];
            return (
              <div key={k} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Contract</div>
                    <div className="text-sm font-medium text-gray-600">{nft.name || 'Unnamed Collection'}</div>
                    <div className="font-mono text-xs text-gray-600">{nft.contract}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Token ID</div>
                    <div className="font-mono text-sm text-gray-600">{nft.tokenId}</div>
                  </div>
                  <div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${st?.valid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                      {st?.valid ? (nft?.existing ? 'Registered' : 'Ready') : 'Incomplete'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleForm(nft)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {st?.open ? 'Close' : st?.valid ? 'Edit' : 'Fill out'}
                    </button>
                    {nft?.existing && (
                      <button
                        onClick={() => router.push('/tickets')}
                        className="text-green-600 hover:text-green-800 text-sm font-medium"
                      >
                        View Ticket
                      </button>
                    )}
                  </div>
                </div>

                {st?.open && (
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                      <input
                        value={st.data.firstName}
                        onChange={(e) => updateField(nft, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        placeholder="Ada"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                      <input
                        value={st.data.lastName}
                        onChange={(e) => updateField(nft, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        placeholder="Lovelace"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={st.data.email}
                        onChange={(e) => updateField(nft, 'email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-600"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8">
          <button
            onClick={submit}
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit registrations'}
          </button>
        </div>
      </div>
    </div>
  );
}


