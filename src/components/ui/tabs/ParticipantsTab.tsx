// src/components/ParticipantsTab.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from 'ethers';

export function ParticipantsTab() {
  const [participants, setParticipants] = useState<{ number: string; user: string; timestamp: string }[]>([]);

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  useEffect(() => {
    const fetchParticipants = async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'event NumberSelected(uint256 round, address selector, uint8 number)',
        'function currentRound() view returns (uint256)'
      ], provider);
      const currentRound = await contract.currentRound();
      const latestBlock = await provider.getBlockNumber();
      const fromBlock = latestBlock - 50000; // ~1-2 days, covers full round
      const filter = contract.filters.NumberSelected(null);
      const events = await contract.queryFilter(filter, fromBlock, 'latest');
      const partsPromises = events.map(async (event) => {
        const parsedLog = contract.interface.parseLog(event);
        if (!parsedLog || parsedLog.args[0] !== currentRound) return null; // Manual filter by round
        const block = await provider.getBlock(event.blockNumber);
        if (!block || !block.timestamp) return null; // Safely handle if block or timestamp is null/undefined
        const timestamp = new Date(block.timestamp * 1000).toLocaleString(); // Format nicer: local time
        return {
          number: parsedLog.args[2].toString().padStart(2, '0'),
          user: truncateAddress(parsedLog.args[1]), // Truncate user address for brevity (add truncate function if needed)
          timestamp,
        };
      });
      const parts = (await Promise.all(partsPromises)).filter(Boolean) as { number: string; user: string; timestamp: string }[]; // Remove nulls
      // Sort by number ascending
      parts.sort((a, b) => parseInt(a.number) - parseInt(b.number));
      setParticipants(parts);
    };

    fetchParticipants();
  }, [contractAddress, rpcUrl]);

  // Helper to truncate address (add to lib if not exist)
  const truncateAddress = (addr: string) => addr.slice(0, 6) + '...' + addr.slice(-4);

  // Generate full 00-99 list, fill with purchased data
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
    <div className="mx-4 overflow-x-auto"> {/* Responsive scroll if needed */}
      <h2 className="text-lg font-semibold mb-4 text-center">Today&apos;s Participants</h2>
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
      {participants.length === 0 && <p className="text-center text-gray-500 mt-4">No selections yet today.</p>}
    </div>
  );
}