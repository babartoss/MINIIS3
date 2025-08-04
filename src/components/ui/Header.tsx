// Updated: src/components/Header.tsx
// Changes:
// - Enhanced overall layout for better balance and professionalism: Increased padding to py-3 for more vertical space, used gap-4 for consistent spacing between elements.
// - Improved alignment: Ensured all elements are centered vertically with items-center, and used justify-between for even distribution.
// - Enlarged user avatar from w-6 h-6 to w-8 h-8 for better visibility.
// - Adjusted avatar position from top-1 right-1 to top-2 right-2 to ensure it sits comfortably inside the border without overflowing.
// - Refined text sizes: Welcome message to text-lg for prominence, badges to text-base for consistency.
// - Added subtle hover effects on badges and avatar for improved interactivity and professional feel.
// - Ensured responsiveness with flex-wrap and max-w-full on the container.
// - Maintained existing features like poolBalance fetching and user dropdown.

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
        className="mt-2 mb-2 mx-4 px-4 py-3 card card-primary flex flex-row items-center justify-between border-2 border-dashed border-primary-light bg-gradient-to-r from-primary/5 to-primary/10 shadow-md rounded-lg flex-wrap gap-4"
      >
        <div className="text-base font-bold bg-primary text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
          ROUND {roundNumber}
        </div>
        <div className="text-lg font-semibold text-center text-primary-dark flex-grow">
          Welcome to {APP_NAME}!
        </div>
        <div className="text-base font-bold bg-green-500 text-white px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-shadow">
          Prize Pool: {poolBalance} USDC
        </div>
        {context?.user && (
          <div 
            className="absolute top-2 right-2 cursor-pointer z-20 hover:scale-105 transition-transform"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {context.user.pfpUrl && (
              <img 
                src={context.user.pfpUrl} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border-2 border-primary shadow-sm"
              />
            )}
          </div>
        )}
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