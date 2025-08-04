// Updated: src/components/Header.tsx
// Changes:
// - Optimized layout for balance and professionalism: Increased gap-6 for better spacing, ensured no wrapping on larger screens with sm:flex-nowrap.
// - Enlarged user avatar to w-10 h-10 for better visibility.
// - Adjusted avatar position to top-3 right-3 to ensure it sits fully inside the dashed border without overflowing.
// - Increased vertical padding to py-4 for more breathing room, making the header taller and more prominent.
// - Consistent text sizes: text-base for badges, text-xl for welcome message to make it stand out.
// - Added hover effects on badges (scale-105) and avatar for interactivity.
// - Ensured mobile-friendliness with flex-wrap, while preventing overflow.
// - Maintained existing features (poolBalance fetch, user dropdown).

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
        className="mt-2 mb-2 mx-4 px-4 py-4 card card-primary flex flex-row items-center justify-between border-2 border-dashed border-primary-light bg-gradient-to-r from-primary/5 to-primary/10 shadow-md rounded-lg flex-wrap sm:flex-nowrap gap-6"
      >
        <div className="text-base font-bold bg-primary text-white px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer">
          ROUND {roundNumber}
        </div>
        <div className="text-xl font-semibold text-center text-primary-dark flex-grow">
          Welcome to {APP_NAME}!
        </div>
        <div className="text-base font-bold bg-green-500 text-white px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer">
          Prize Pool: {poolBalance} USDC
        </div>
        {context?.user && (
          <div 
            className="absolute top-3 right-3 cursor-pointer z-20 hover:scale-105 transition-transform"
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {context.user.pfpUrl && (
              <img 
                src={context.user.pfpUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border-4 border-primary shadow-md"
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