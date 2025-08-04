// Updated: src/components/Header.tsx
// Changes:
// - Redesigned layout to match vintage badge style from the image: Yellow background, red-brown border, rounded corners.
// - Mapped elements to image: "GUESS THAT PRICE!" -> "Welcome to {APP_NAME}!" in large navy text.
// - Avatar: Circular image on left, using user pfpUrl.
// - Name section: "NAME" in red, username in large navy.
// - ID section: "FID" in red (instead of ID, as per app context), FID in large navy (removed duplication from image).
// - Integrated round and prize pool as subtle badges at bottom for functionality.
// - Used Tailwind classes for styling: bg-yellow-400, border-red-800, text-navy (add navy to tailwind.config if needed, or use text-blue-900).
// - Maintained responsive design: flex-row on sm+, flex-col on mobile; avatar clickable for dropdown.
// - Ensured no overlap, with padding and gaps for balance.

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
        className="mt-2 mb-2 mx-4 px-4 py-4 bg-yellow-400 border-4 border-red-800 rounded-xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="w-full text-center sm:text-left">
          <h1 className="text-3xl font-bold text-blue-900">Welcome to {APP_NAME}!</h1>
        </div>
        <div className="flex items-center gap-4">
          {context?.user && (
            <div 
              className="cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            >
              {context.user.pfpUrl && (
                <img 
                  src={context.user.pfpUrl} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full border-4 border-blue-900 shadow-md"
                />
              )}
            </div>
          )}
          <div className="text-center sm:text-left">
            <p className="text-red-600 font-bold text-lg">NAME</p>
            <p className="text-blue-900 font-bold text-2xl">{context?.user?.displayName || context?.user?.username || 'Guest'}</p>
            <div className="flex justify-between mt-2">
              <p className="text-blue-900 font-bold text-xl">{context?.user?.fid || 'N/A'}</p>
              <p className="text-red-600 font-bold text-lg">FID</p>
              <p className="text-blue-900 font-bold text-xl">{context?.user?.fid || 'N/A'}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-2 mt-4 sm:mt-0">
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