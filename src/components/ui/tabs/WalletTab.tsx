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
    <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
      {address && (
        <div className="text-sm mb-2">
          <span className="font-semibold">Address:</span> {truncateAddress(address)}
        </div>
      )}
      {chainId && (
        <div className="text-sm">
          <span className="font-semibold">Chain ID:</span> {chainId}
        </div>
      )}
      {!address && !chainId && (
        <div className="text-sm text-gray-500">No wallet connected</div>
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
        <Button onClick={() => disconnect()} className="w-full max-w-xs bg-red-500 hover:bg-red-600">
          Disconnect Wallet
        </Button>
      ) : context ? (
        <Button onClick={() => connect({ connector: connectors[0] })} className="w-full max-w-xs">
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
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: "url('/wllt.jpg')" }}
    >
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center">Wallet Management</h2>
        
        <WalletStatus address={address} chainId={chainId} />
        
        <ConnectionControls
          isConnected={isConnected}
          context={context}
          connect={connect}
          connectors={connectors}
          disconnect={disconnect}
        />
        
        {isConnected && (
          <div className="space-y-4">
            <Button
              onClick={handleSwitchChain}
              disabled={isChainSwitchPending}
              isLoading={isChainSwitchPending}
              className="w-full"
            >
              Switch to {base.name}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}