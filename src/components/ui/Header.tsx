// Updated: src/components/Header.tsx
// Changes:
// - Made layout more compact: Reduced padding to py-3 px-4, added w-fit mx-auto to fit content tightly.
// - Adjusted text sizes: Smaller fonts (text-lg for welcome, text-md for name, text-sm for FID) to fit horizontally better.
// - Simplified user info: "Name: BARBATOS" on line 1, "FID: 1042494" on line 2, removed duplication of FID values.
// - Placed round and prize pool badges in a horizontal flex-row at bottom for compactness.
// - Ensured responsive: flex-col on mobile for stacking, flex-row on sm+ for side-by-side.
// - Suggestions for professionalism: Added subtle text-shadow-md for readability, uppercase for labels, and hover:shadow-lg on card for interactivity. Consider adding a custom vintage font via @font-face in globals.css if available.

"use client";

import { useState, useEffect } from "react";
import { APP_NAME } from "@/lib/constants";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniApp } from "@neynar/react";
import { ethers } from 'ethers';

type HeaderProps = {
  neynarUser?: {
    fid: number;
    score: number;
  } | null;
};

export function Header({ neynarUser }: HeaderProps) {
  const { context } = useMiniApp();
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [poolBalance, setPoolBalance] = useState<string>('0');
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org';

  useEffect(() => {
    // Calculate round number
    const updateRound = () => {
      const now = new Date();
      const start = new Date(now);
      start.setUTCHours(12, 30, 0, 0);
      if (now < start) start.setUTCDate(start.getUTCDate() - 1);
      const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setRoundNumber(daysSinceStart);
    };

    updateRound();
    const interval = setInterval(updateRound, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fetch pool balance
    const fetchPoolBalance = async () => {
      if (!contractAddress) return;
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, ['function getPoolBalance() view returns (uint256)'], provider);
      try {
        const balance = await contract.getPoolBalance();
        setPoolBalance(ethers.formatUnits(balance, 6));
      } catch (error) {
        console.error('Error fetching pool balance:', error);
      }
    };

    fetchPoolBalance();
    const interval = setInterval(fetchPoolBalance, 60000);
    return () => clearInterval(interval);
  }, [contractAddress, rpcUrl]);

  return (
    <div className="relative max-w-full">
      <div 
        className="mt-2 mb-2 mx-auto px-4 py-3 bg-yellow-400 border-4 border-red-800 rounded-xl shadow-md hover:shadow-lg transition-shadow w-fit flex flex-col sm:flex-row items-center justify-between gap-3"
      >
        <div className="w-full text-center sm:text-left">
          <h1 className="text-lg font-bold text-blue-900 text-shadow-md">Welcome to {APP_NAME}!</h1>
        </div>
        <div className="flex items-center gap-3">
          {context?.user && (
            <div 
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              {context.user.pfpUrl && (
                <img 
                  src={context.user.pfpUrl} 
                  alt="Profile" 
                  className="w-16 h-16 rounded-full border-4 border-blue-900 shadow-md"
                />
              )}
            </div>
          )}
          <div className="text-center sm:text-left">
            <p className="text-md font-bold text-blue-900 uppercase"><span className="text-red-600">Name:</span> {context?.user?.displayName || context?.user?.username || 'Guest'}</p>
            <p className="text-sm font-bold text-blue-900 uppercase"><span className="text-red-600">FID:</span> {context?.user?.fid || 'N/A'}</p>
          </div>
        </div>
        <div className="flex flex-row items-center gap-2 mt-2 sm:mt-0">
          <div className="text-sm font-bold bg-primary text-white px-3 py-1 rounded-full shadow-sm">
            ROUND {roundNumber}
          </div>
          <div className="text-sm font-bold bg-green-500 text-white px-3 py-1 rounded-full shadow-sm">
            Prize Pool: {poolBalance} USDC
          </div>
        </div>
      </div>
      {context?.user && isUserDropdownOpen && (
        <div className="absolute top-full right-0 z-50 w-48 mt-1 mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-3 space-y-2">
            <div className="text-right">
              <h3 
                className="font-bold text-sm hover:underline cursor-pointer inline-block"
                onClick={() => sdk.actions.viewProfile({ fid: context.user.fid })}
              >
                {context.user.displayName || context.user.username}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                @{context.user.username}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                FID: {context.user.fid}
              </p>
              {neynarUser && (
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Neynar Score: {neynarUser.score}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}