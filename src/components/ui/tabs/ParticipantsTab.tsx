// src/components/ParticipantsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from 'ethers';

export function ParticipantsTab() {
  const [participants, setParticipants] = useState<{ number: string; user: string; round: string }[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false); // Thêm loading state cho button

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  const CACHE_KEY = (round: number) => `participants_round_${round}`; // Key cache per round

  const fetchParticipants = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function currentRound() view returns (uint256)'
      ], provider);
      const round = Number(await contract.currentRound());
      setCurrentRound(round);

      // Check localStorage cache first
      const cachedData = localStorage.getItem(CACHE_KEY(round));
      if (cachedData && !forceRefresh) {
        setParticipants(JSON.parse(cachedData));
        setError(null);
        setLoading(false);
        return;
      }

      // Fetch from Redis via API
      const response = await fetch(`/api/get-participants?round=${round}`);
      if (!response.ok) throw new Error('Failed to fetch participants from Redis');
      const redisParticipants = await response.json();

      // Format for display
      const fullList = Array.from({ length: 100 }, (_, i) => {
        const num = i.toString().padStart(2, '0');
        const part = redisParticipants.find((p: any) => p.number === num);
        return {
          number: num,
          user: part ? (part.username ? `@${part.username}` : truncateAddress(part.address)) : 'Available',
          round: part ? round.toString() : '-',
        };
      });

      setParticipants(fullList);
      localStorage.setItem(CACHE_KEY(round), JSON.stringify(fullList)); // Cache
      setError(null);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants. Check console for details.');
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParticipants(); // Fetch ban đầu khi mount (dùng cache nếu có)

    // Thêm polling để tự động làm mới khi vòng mới bắt đầu (kiểm tra mỗi 30 giây)
    const interval = setInterval(() => {
      fetchParticipants(true); // Force refresh để đồng bộ với auto-round
    }, 30000);

    return () => clearInterval(interval);
  }, [contractAddress, rpcUrl]);

  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  return (
    <div className="mx-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4 text-center">Today&apos;s Participants</h2>
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}
      <button 
        onClick={() => fetchParticipants(true)} // Force refresh khi nhấn
        disabled={loading}
        className="btn btn-primary mb-4 w-full" // Thêm style nếu cần
      >
        {loading ? 'Loading...' : 'Refresh Participants'}
      </button>
      <table className="table-auto w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-2 border-b">Number</th>
            <th className="px-4 py-2 border-b">Player</th>
            <th className="px-4 py-2 border-b">Round</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((item, index) => (
            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''} hover:bg-gray-200 dark:hover:bg-gray-600`}>
              <td className="px-4 py-2 border-b text-center font-bold">{item.number}</td>
              <td className="px-4 py-2 border-b text-center">{item.user}</td>
              <td className="px-4 py-2 border-b text-center text-sm text-gray-600 dark:text-gray-400">{item.round}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {participants.length === 0 && !error && <p className="text-center text-gray-500 mt-4">No selections yet today.</p>}
    </div>
  );
}