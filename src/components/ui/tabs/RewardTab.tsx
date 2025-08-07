// src/components/RewardTab.tsx
"use client";

import { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { useAccount, useWriteContract } from 'wagmi'; // Add useWriteContract for claiming

export function RewardTab() {
  const { address: userAddress, isConnected } = useAccount(); // Get connected status
  const [rewards, setRewards] = useState<{ round: number; matches: number; totalWinners: number; claimed: boolean; winningNumbers: string; }[]>([]);
  const [loadingClaim, setLoadingClaim] = useState<number | null>(null); // To show loading when claiming

  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';  // Updated to mainnet

  const { writeContractAsync: claimRewardAsync } = useWriteContract(); // Wagmi hook for writing to contract

  useEffect(() => {
    if (!userAddress) return;

    const fetchRewards = async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function currentRound() view returns (uint256)',
        'function roundClosed(uint256) view returns (bool)',
        'function winningNumbers(uint256) view returns (uint8[5])',
        'function selectedNumbers(uint256, uint8) view returns (address)',
        'function hasClaimed(uint256, address) view returns (bool)'
      ], provider);

      const currentRound = await contract.currentRound();
      const userRewards = [];

      for (let round = 1; round <= currentRound; round++) {
        if (await contract.roundClosed(round)) {
          const wNums = await contract.winningNumbers(round);
          let matches = 0;
          const winnersSet = new Set<string>(); // To count unique winners
          for (let i = 0; i < 100; i++) {
            const selector = await contract.selectedNumbers(round, i);
            if (selector !== ethers.ZeroAddress) {
              let playerMatches = 0;
              for (let j = 0; j < 5; j++) {
                if (i === wNums[j].toNumber()) {
                  playerMatches++;
                }
              }
              if (playerMatches > 0) {
                winnersSet.add(selector); // Add unique winner
              }
              if (selector === userAddress) {
                matches += playerMatches;
              }
            }
          }
          const hasClaimed = await contract.hasClaimed(round, userAddress);
          if (matches > 0 || hasClaimed) { // Show if has matches or claimed
            userRewards.push({
              round,
              matches,
              totalWinners: winnersSet.size, // Number of unique winners
              claimed: hasClaimed,
              winningNumbers: wNums.map((n: ethers.BigNumberish) => Number(n).toString().padStart(2, '0')).join(', '),
            });
          }
        }
      }
      setRewards(userRewards);
    };

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
        abi: ['function claimReward(uint256)'],
        functionName: 'claimReward',
        args: [round],
      });
      console.log('Claim tx hash:', claimHash);
      // Wait for confirmation if needed, but for simplicity, assume success and update state
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
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        {rewards.map((reward, index) => (
          <div key={index} className="mb-4 border-b pb-2">
            <p><strong>Round {reward.round}:</strong> You matched {reward.matches} out of 5 prizes (each prize = 0.20 USDC)</p>
            <p>Total winners in round: {reward.totalWinners} (up to 5 prizes distributed)</p>
            <p>Round Results: {reward.winningNumbers}</p>
            <p>Status: {reward.claimed ? 'Claimed' : 'Available'}</p>
            {!reward.claimed && reward.matches > 0 && (
              <button
                onClick={() => handleClaim(reward.round)}
                disabled={loadingClaim === reward.round}
                className="btn btn-primary mt-2"
              >
                {loadingClaim === reward.round ? 'Claiming...' : 'Claim Reward'}
              </button>
            )}
          </div>
        ))}
        {rewards.length === 0 && <p>No rewards available yet.</p>}
      </div>
    </div>
  );
}