// File: src/components/WalletTab.tsx (Simplified version with Connector type import)
"use client";

import { useCallback, useEffect } from "react";
import { useAccount, useDisconnect, useConnect, useSwitchChain, useChainId, type Connector } from "wagmi"; // Added type Connector import
import { base } from "wagmi/chains";  // Changed to mainnet Base
import { Button } from "../Button";
import { truncateAddress } from "../../../lib/truncateAddress";
import { USE_WALLET } from "../../../lib/constants";
import { useMiniApp } from "@neynar/react";

// Extend window type for ethereum if needed
declare global {
  interface Window {
    ethereum?: {
      isFarcaster?: boolean;
      // Add other properties if needed
    };
  }
}

interface WalletStatusProps {
  address?: string;
  chainId?: number;
}

function WalletStatus({ address, chainId }: WalletStatusProps) {
  return (
    <div className="bg-white/10 backdrop-blur-md dark:bg-secondary-dark/50 p-4 rounded-lg shadow-lg border border-white/20">
      {address && (
        <div className="text-sm mb-2 text-white">
          <span className="font-semibold">Address:</span> {truncateAddress(address)}
        </div>
      )}
      {chainId && (
        <div className="text-sm text-white">
          <span className="font-semibold">Chain ID:</span> {chainId}
        </div>
      )}
      {!address && !chainId && (
        <div className="text-sm text-gray-300">No wallet connected</div>
      )}
    </div>
  );
}

interface ConnectionControlsProps {
  isConnected: boolean;
  context: {
    user?: { fid?: number };
    client?: unknown;
  } | null;
  connect: (args: { connector: Connector }) => void;
  connectors: readonly Connector[];
  disconnect: () => void;
}

function ConnectionControls({
  isConnected,
  context,
  connect,
  connectors,
  disconnect,
}: ConnectionControlsProps) {
  return (
    <div className="flex justify-center">
      {isConnected ? (
        <Button onClick={() => disconnect()} className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-md transition-all duration-300">
          Disconnect Wallet
        </Button>
      ) : context ? (
        <Button onClick={() => connect({ connector: connectors[0] })} className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-full shadow-md transition-all duration-300">
          Connect Farcaster Wallet
        </Button>
      ) : null}
    </div>
  );
}

export function WalletTab() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const { disconnect } = useDisconnect();
  const { connect, connectors } = useConnect();

  const {
    switchChain,
    isPending: isChainSwitchPending,
  } = useSwitchChain();

  const { context } = useMiniApp();

  useEffect(() => {
    const isInFarcasterClient = typeof window !== 'undefined' && 
      (window.location.href.includes('warpcast.com') || 
       window.location.href.includes('farcaster') ||
       window.ethereum?.isFarcaster ||
       context?.client);
    
    if (context?.user?.fid && !isConnected && connectors.length > 0 && isInFarcasterClient) {
      console.log("Auto-connecting Farcaster wallet...");
      try {
        connect({ connector: connectors[0] });
      } catch (error) {
        console.error("Auto-connect failed:", error);
      }
    }
  }, [context?.user?.fid, isConnected, connectors, connect, context?.client]);

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: base.id });
  }, [switchChain]);

  if (!USE_WALLET) {
    return null;
  }

  return (
    <div 
      className="flex flex-col items-center justify-center p-4 bg-contain bg-center bg-no-repeat relative overflow-hidden h-auto max-h-[80vh] w-full max-w-sm mx-auto rounded-xl shadow-xl aspect-square"  // Changed to max-w-sm (384px) for consistency, added aspect-square to make width=height=384px
      style={{ 
        backgroundImage: "url('/wllt.png')",  // Assumes resized 384x384 image fits perfectly in square container
      }}
    >
      {/* Overlay for improved readability, adjusted for mobile */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-xl"></div>
      
      <div className="w-full max-w-sm bg-transparent relative z-10 space-y-6 text-center"> {/* Consistent max-w-sm */}
        <h2 className="text-2xl font-bold text-white drop-shadow-md">Wallet Management</h2> {/* Reduced text size for compactness */}
        
        <WalletStatus address={address} chainId={chainId} />
        
        <ConnectionControls
          isConnected={isConnected}
          context={context}
          connect={connect}
          connectors={connectors}
          disconnect={disconnect}
        />
        
        {isConnected && (
          <div className="space-y-4 flex justify-center">
            <Button
              onClick={handleSwitchChain}
              disabled={isChainSwitchPending}
              isLoading={isChainSwitchPending}
              className="px-6 py-3 bg-primary hover:bg-primary-light text-white font-semibold rounded-full shadow-md transition-all duration-300"
            >
              Switch to {base.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}