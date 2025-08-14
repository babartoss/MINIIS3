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
        'function currentRound() view returns (uint256)',
        'function selectedNumbers(uint256 round, uint8 number) view returns (address)'
      ], provider);
      const round = Number(await contract.currentRound());
      setCurrentRound(round);

      // Check cache đầu tiên (localStorage)
      const cachedData = localStorage.getItem(CACHE_KEY(round));
      if (cachedData && !forceRefresh) {
        setParticipants(JSON.parse(cachedData));
        setError(null);
        setLoading(false);
        return;
      }

      // Fetch on-chain (batch)
      const numPromises = Array.from({ length: 100 }, (_, num) => contract.selectedNumbers(round, num));
      const addresses = await Promise.all(numPromises);
      const parts = addresses
        .map((addr, num) => addr !== ethers.ZeroAddress ? { number: num.toString().padStart(2, '0'), user: addr, round: round.toString() } : null)
        .filter(Boolean) as { number: string; user: string; round: string }[];

      // Fetch FIDs và users (giữ nguyên, nhưng chỉ gọi khi không cache)
      const uniqueAddresses = [...new Set(parts.map(p => p.user.toLowerCase()))];
      const fidsResponse = await fetch('/api/get-fids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses: uniqueAddresses }),
      });
      if (!fidsResponse.ok) throw new Error('Failed to fetch fids');
      const fidsMap = await fidsResponse.json();

      const fids = Object.values(fidsMap).filter(fid => fid);
      let usersMap: { [fid: number]: { username: string; display_name: string } } = {};
      if (fids.length > 0) {
        const usersResponse = await fetch('/api/get-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fids }),
        });
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        usersMap = await usersResponse.json();
      }

      parts.forEach(part => {
        const fid = fidsMap[part.user.toLowerCase()];
        if (fid) {
          const userInfo = usersMap[fid];
          part.user = userInfo?.username ? `@${userInfo.username}` : truncateAddress(part.user);
        } else {
          part.user = truncateAddress(part.user);
        }
      });

      const sortedParts = parts.sort((a, b) => parseInt(a.number) - parseInt(b.number));
      setParticipants(sortedParts);
      localStorage.setItem(CACHE_KEY(round), JSON.stringify(sortedParts)); // Cache
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
  }, [contractAddress, rpcUrl]);

  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

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
          {fullList.map((item, index) => (
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