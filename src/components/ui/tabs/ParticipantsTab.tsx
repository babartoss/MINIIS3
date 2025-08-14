// src/components/ui/tabs/ParticipantsTab.tsx
"use client";

import { useState } from "react";
import { ethers } from 'ethers';
import { getParticipantsForRound } from "~/lib/kv"; // Chỉ import getParticipantsForRound từ KV

export function ParticipantsTab() {
  const [participants, setParticipants] = useState<{ number: string; user: string; round: string }[]>([]);
  const [_currentRound, setCurrentRound] = useState<number>(0); // Renamed to _currentRound to suppress unused var warning
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  const refreshParticipants = async () => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function currentRound() view returns (uint256)'
      ], provider); // Chỉ cần currentRound, không cần selectedNumbers nữa vì loại bỏ fallback
      const round = Number(await contract.currentRound());
      setCurrentRound(round);

      // Chỉ fetch từ Redis (loại bỏ fallback Neynar và contract scan)
      const cachedParts = await getParticipantsForRound(round);
      setParticipants(cachedParts.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
      setError(null);
    } catch (err) {
      console.error('Error refreshing participants:', err);
      setError('Failed to load participants. Check console for details.');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const fullList = Array.from({ length: 100 }, (_, i) => {
    const num = i.toString().padStart(2, '0');
    const part = participants.find(p => p.number === num);
    return {
      number: num,
      user: part ? part.user : 'Available',
      round: part ? part.round : '-',
    };
  });

  return (
    <div className="mx-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4 text-center">Today&apos;s Participants</h2>
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}
      <button 
        onClick={refreshParticipants}
        disabled={loading}
        className="btn btn-primary mb-4"
      >
        {loading ? 'Refreshing...' : 'Refresh List'}
      </button>
      {participants.length === 0 && !loading && <p className="text-center text-gray-500 mb-4">Press Refresh to load participants.</p>}
      <table className="table-auto w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-2 border-b">Number</th>
            <th className="px-4 py-2 border-b">Player</th>
            <th className="px-4 py-2 border-b">Round</th>
          </tr>
        </thead>
        <tbody>
          {fullList.map((item, index) => (
            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''} hover:bg-gray-200 dark:hover:bg-gray-600`}>
              <td className="px-4 py-2 border-b text-center font-bold">{item.number}</td>
              <td className="px-4 py-2 border-b text-center">{item.user}</td>
              <td className="px-4 py-2 border-b text-center text-sm text-gray-600 dark:text-gray-400">{item.round}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {participants.length === 0 && !error && !loading && <p className="text-center text-gray-500 mt-4">No selections yet today.</p>}
    </div>
  );
}