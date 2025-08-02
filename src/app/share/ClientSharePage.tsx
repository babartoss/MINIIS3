// Modified: src/app/share/ClientSharePage.tsx
// Changes:
// - Removed contract from display

'use client';

import { useState, useEffect } from 'react';
import { useMiniApp } from '@neynar/react';

type Props = {
  searchParams: Promise<Record<string, string | string[]>>;
}

export default function ClientSharePage({ searchParams }: Props) {
  const [params, setParams] = useState<Record<string, string | string[]> | null>(null);
  const { isSDKLoaded } = useMiniApp();

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await searchParams;
      setParams(resolvedParams);
    };
    loadParams();
  }, [searchParams]);

  if (!isSDKLoaded || !params) {
    return <div className="p-4">Loading Ticket Details...</div>;
  }

  const number = params.number || '00';
  const round = params.round || '1';
  const player = params.player || '';
  const txHash = params.txHash || '';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ticket Details</h1>
      <p>Player: {player}</p>
      <p>Number: {number}</p>
      <p>Round: {round}</p>
      <p>Transaction: {txHash}</p>
    </div>
  );
}