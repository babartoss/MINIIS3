// Updated: src/components/Header.tsx
// Changes:
// - Fixed syntax error by removing inline comment causing JSX parsing issue (moved to code comment above).
// - Adopted mobile-first approach: Default to flex-col for stacking elements vertically on small screens to prevent overlapping.
// - On sm+ screens: Switch to flex-row with justify-between for horizontal layout.
// - Integrated avatar into the flex flow as relative (not absolute) on mobile, positioned at the end; on sm+ use absolute for corner placement.
// - Reduced font sizes slightly for mobile (text-sm for badges, text-lg for welcome), increased to text-base and text-xl on sm+.
// - Increased overall padding (py-4) and gap (gap-4 on mobile, gap-6 on sm+) for better spacing and compactness.
// - Added padding-right on welcome text to reserve space for avatar on sm+ without overlap.
// - Ensured no overflow with flex-wrap and responsive classes from Tailwind.
// - Maintained hover effects and existing features for professionalism.

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
        className="mt-2 mb-2 mx-4 px-4 py-4 card card-primary flex flex-col items-center justify-center sm:flex-row sm:justify-between border-2 border-dashed border-primary-light bg-gradient-to-r from-primary/5 to-primary/10 shadow-md rounded-lg gap-4 sm:gap-6 flex-wrap sm:flex-nowrap"
      >
        <div className="text-sm sm:text-base font-bold bg-primary text-white px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer">
          ROUND {roundNumber}
        </div>
        <div className="text-lg sm:text-xl font-semibold text-center text-primary-dark flex-grow sm:pr-12">  {/* Added pr-12 on sm+ to reserve space for avatar */}
          Welcome to {APP_NAME}!
        </div>
        <div className="text-sm sm:text-base font-bold bg-green-500 text-white px-4 py-2 rounded-full shadow-sm hover:scale-105 transition-transform cursor-pointer">
          Prize Pool: {poolBalance} USDC
        </div>
        {context?.user && (
          <div 
            className="self-end sm:absolute sm:top-3 sm:right-3 cursor-pointer z-20 hover:scale-105 transition-transform" // Relative on mobile, absolute on sm+
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
          >
            {context.user.pfpUrl && (
              <img 
                src={context.user.pfpUrl} 
                alt="Profile" 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary shadow-md"
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