// src/components/RewardTab.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { useAccount, useWriteContract } from 'wagmi';

export function RewardTab() {
  const { address: userAddress, isConnected } = useAccount();
  const [rewards, setRewards] = useState<{ round: number; prizes: { prizeIndex: number; number: string; winner: string }[]; claimed: boolean; }[]>([]);
  const [rewardPerUSDC, setRewardPerUSDC] = useState<number>(0.20); // Default, sẽ fetch từ contract
  const [loadingClaim, setLoadingClaim] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  const { writeContractAsync: claimRewardAsync } = useWriteContract();

  const shortenAddress = (addr: string) => {
    if (addr === "No Winner") return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const fetchRewards = async () => {
    if (!userAddress) return;
    setIsLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function currentRound() view returns (uint256)',
        'function roundClosed(uint256) view returns (bool)',
        'function winningNumbers(uint256) view returns (uint8[5])',
        'function selectedNumbers(uint256, uint8) view returns (address)',
        'function hasClaimed(uint256, address) view returns (bool)',
        'function rewardPerMatch() view returns (uint256)'
      ], provider);

      // Fetch rewardPerMatch một lần (không thay đổi per round)
      const rewardPerMatch = await contract.rewardPerMatch();
      setRewardPerUSDC(Number(rewardPerMatch) / 1e6);

      const currentRound = Number(await contract.currentRound());
      const userRewards = [];

      for (let round = currentRound; round >= Math.max(1, currentRound - 9); round--) {
        const isClosed = await contract.roundClosed(round);
        if (isClosed) {
          const wNums = await contract.winningNumbers(round);
          const prizes = [];
          for (let j = 0; j < 5; j++) {
            const numValue = Number(wNums[j]);
            const num = numValue.toString().padStart(2, '0');
            const winnerAddr = await contract.selectedNumbers(round, numValue);
            prizes.push({
              prizeIndex: j + 1,
              number: num,
              winner: winnerAddr === ethers.ZeroAddress ? "No Winner" : winnerAddr,
            });
          }
          const hasClaimed = await contract.hasClaimed(round, userAddress);
          userRewards.push({
            round,
            prizes,
            claimed: hasClaimed,
          });
        }
      }
      setRewards(userRewards);
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRewards();
  }, [userAddress, contractAddress, rpcUrl]);

  const handleClaim = async (round: number) => {
    if (!isConnected || !userAddress) {
      console.error("Wallet not connected");
      return;
    }
    setLoadingClaim(round);
    try {
      const claimHash = await claimRewardAsync({
        address: contractAddress,
        abi: [{
          name: 'claimReward',
          type: 'function',
          inputs: [{ name: 'round', type: 'uint256' }],
          outputs: [],
          stateMutability: 'nonpayable',
        }],
        functionName: 'claimReward',
        args: [BigInt(round)],
      });
      console.log('Claim tx hash:', claimHash);
      // Assume success and update state; in production, wait for receipt
      setRewards(prev => prev.map(r => r.round === round ? { ...r, claimed: true } : r));
    } catch (error) {
      console.error("Claim failed:", error);
      alert("Claim failed. Please try again.");
    }
    setLoadingClaim(null);
  };

  return (
    <div className="mx-6">
      <h2 className="text-lg font-semibold mb-2">Your Rewards</h2>
      <button 
        onClick={fetchRewards} 
        disabled={isLoading || !isConnected}
        className="btn btn-secondary mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Rewards'}
      </button>
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md">
        {rewards.map((reward, index) => {
          const userMatches = reward.prizes.filter(p => p.winner.toLowerCase() === userAddress?.toLowerCase()).length;
          return (
            <div key={index} className="mb-6 border-b pb-4 last:border-b-0">
              <h3 className="font-bold text-xl mb-3 text-center">Round {reward.round}</h3>
              <div className="overflow-x-auto">
                <table className="table-auto w-full bg-white dark:bg-gray-700 rounded-lg shadow-md border-collapse">
                  <thead>
                    <tr className="bg-primary text-white">
                      <th className="px-4 py-2 border-b text-left">Prize</th>
                      <th className="px-4 py-2 border-b text-left">Number</th>
                      <th className="px-4 py-2 border-b text-left">Winner</th>
                      <th className="px-4 py-2 border-b text-left">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reward.prizes.map((prize, prizeIndex) => (
                      <tr 
                        key={prize.prizeIndex} 
                        className={`${prizeIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-600' : 'bg-white dark:bg-gray-700'} hover:bg-gray-200 dark:hover:bg-gray-500 ${prize.winner.toLowerCase() === userAddress?.toLowerCase() ? "bg-green-100 dark:bg-green-800" : ""}`}
                      >
                        <td className="px-4 py-2 border-b text-sm font-medium">Prize {prize.prizeIndex}</td>
                        <td className="px-4 py-2 border-b text-sm text-red-500 font-bold">{prize.number}</td>
                        <td className="px-4 py-2 border-b text-sm">{shortenAddress(prize.winner)}</td>
                        <td className="px-4 py-2 border-b text-sm">
                          {prize.winner !== "No Winner" ? `${rewardPerUSDC.toFixed(2)} USDC` : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">Status: {reward.claimed ? 'Claimed' : 'Available'}</p>
              {!reward.claimed && userMatches > 0 && (
                <div className="flex justify-center mt-3">
                  <button
                    onClick={() => handleClaim(reward.round)}
                    disabled={loadingClaim === reward.round}
                    className="btn btn-primary px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {loadingClaim === reward.round ? 'Claiming...' : 'Claim Reward'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {rewards.length === 0 && <p className="text-center text-gray-500">No rewards available yet.</p>}
      </div>
    </div>
  );
}