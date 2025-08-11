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
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function currentRound() view returns (uint256)',
        'function roundClosed(uint256) view returns (bool)',
        'function winningNumbers(uint256, uint256) view returns (uint8)',
        'function selectedNumbers(uint256, uint8) view returns (address)',
        'function hasClaimed(uint256, address) view returns (bool)',
        'function rewardPerMatch() view returns (uint256)'
      ], provider);

      const rewardPerMatch = await contract.rewardPerMatch();
      setRewardPerUSDC(Number(rewardPerMatch) / 1e6);

      const currentRound = Number(await contract.currentRound());
      const userRewards = [];

      for (let round = currentRound; round >= Math.max(1, currentRound - 9); round--) {
        const isClosed = await contract.roundClosed(round);
        if (isClosed) {
          // Fix: Loop to fetch each winningNumbers(round, i) vì ABI là per index
          const wNums = [];
          for (let i = 0; i < 5; i++) {
            wNums.push(await contract.winningNumbers(round, i));
          }

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
    } catch (error: any) {
      console.error("Failed to fetch rewards:", error);
      setError(`Failed to load rewards: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [userAddress, contractAddress, rpcUrl]);

  const handleClaim = async (round: number) => {
    if (loadingClaim !== null) return;
    setLoadingClaim(round);
    try {
      await claimRewardAsync({
        address: contractAddress,
        abi: [
          {
            name: 'claimReward',
            type: 'function',
            inputs: [{ name: 'round', type: 'uint256' }],
            outputs: [],
            stateMutability: 'nonpayable',
          },
        ],
        functionName: 'claimReward',
        args: [BigInt(round)],  // Fix: Convert number to bigint for uint256
      });
      // Refresh sau claim thành công
      fetchRewards();
    } catch (error: any) {
      console.error('Claim failed:', error);
      setError(`Claim failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoadingClaim(null);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={fetchRewards}
        disabled={isLoading || !isConnected}
        className="btn btn-primary mb-4 px-4 py-2 disabled:opacity-50"
      >
        {isLoading ? 'Refreshing...' : 'Refresh Rewards'}
      </button>
      {error && <div className="bg-red-500 text-white p-2 mb-4 rounded">{error}</div>}
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