// src/components/ParticipantsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from 'ethers';

export function ParticipantsTab() {
  const [participants, setParticipants] = useState<{ number: string; user: string; timestamp: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  const fetchParticipants = async () => {
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'event NumberSelected(uint256 round, address selector, uint8 number)',
        'function currentRound() view returns (uint256)',
        'function selectedNumbers(uint256 round, uint8 number) view returns (address)'
      ], provider);
      const currentRound = Number(await contract.currentRound());

      // Use mapping to fetch
      const parts = [];
      for (let num = 0; num < 100; num++) {
        const addr = await contract.selectedNumbers(currentRound, num);
        if (addr !== ethers.ZeroAddress) {
          const latestBlock = await provider.getBlock('latest');
          let timestamp = '-';
          if (latestBlock) {
            timestamp = new Date(latestBlock.timestamp * 1000).toLocaleString();
          }
          parts.push({ number: num.toString().padStart(2, '0'), user: addr, timestamp });
        }
      }

      // Fetch FID and usernames
      const addresses = [...new Set(parts.map(p => p.user.toLowerCase()))];
      const fidsResponse = await fetch('/api/get-fids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses }),
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

      setParticipants(parts.sort((a, b) => parseInt(a.number) - parseInt(b.number)));
      setError(null);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError('Failed to load participants. Check console for details.');
      setParticipants([]);
    }
  };

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 30000);
    return () => clearInterval(interval);
  }, [contractAddress, rpcUrl]);

  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  const fullList = Array.from({ length: 100 }, (_, i) => {
    const num = i.toString().padStart(2, '0');
    const part = participants.find(p => p.number === num);
    return {
      number: num,
      user: part ? part.user : 'Available',
      timestamp: part ? part.timestamp : '-',
    };
  });

  return (
    <div className="mx-4 overflow-x-auto">
      <h2 className="text-lg font-semibold mb-4 text-center">Today&apos;s Participants</h2>
      {error && <p className="text-center text-red-500 mb-4">{error}</p>}
      <table className="table-auto w-full bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md border-collapse">
        <thead>
          <tr className="bg-primary text-white">
            <th className="px-4 py-2 border-b">Number</th>
            <th className="px-4 py-2 border-b">Player</th>
            <th className="px-4 py-2 border-b">Purchase Time</th>
          </tr>
        </thead>
        <tbody>
          {fullList.map((item, index) => (
            <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''} hover:bg-gray-200 dark:hover:bg-gray-600`}>
              <td className="px-4 py-2 border-b text-center font-bold">{item.number}</td>
              <td className="px-4 py-2 border-b text-center">{item.user}</td>
              <td className="px-4 py-2 border-b text-center text-sm text-gray-600 dark:text-gray-400">{item.timestamp}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {participants.length === 0 && !error && <p className="text-center text-gray-500 mt-4">No selections yet today.</p>}
    </div>
  );
}