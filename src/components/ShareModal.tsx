// src/components/ShareModal.tsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMiniApp } from '@neynar/react';
import { truncateAddress } from '@/lib/truncateAddress';
import { ShareButton } from './ui/Share';
import { ethers } from 'ethers';

const ShareModal: React.FC<{ onClose: () => void; selectedNumber: number; txHash: string }> = ({ onClose, selectedNumber, txHash }) => {
  const [round, setRound] = useState(1);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const { address } = useAccount();
  const { context } = useMiniApp();
  const username = context?.user?.username;
  const player = username || truncateAddress(address || '');
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://your-app-url.vercel.app';
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  useEffect(() => {
    const fetchRound = async () => {
      if (!contractAddress) {
        // Fallback to date calculation if no contract
        const now = new Date();
        const start = new Date(now);
        start.setUTCHours(12, 30, 0, 0);
        if (now < start) start.setUTCDate(start.getUTCDate() - 1);
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setRound(daysSinceStart);
        return;
      }
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, ['function currentRound() view returns (uint256)'], provider);
      try {
        const currentRound = Number(await contract.currentRound());
        setRound(currentRound);
      } catch (error) {
        console.error('Error fetching round:', error);
        // Fallback to date calculation on error
        const now = new Date();
        const start = new Date(now);
        start.setUTCHours(12, 30, 0, 0);
        if (now < start) start.setUTCDate(start.getUTCDate() - 1);
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setRound(daysSinceStart);
      }
    };
    fetchRound();
  }, [contractAddress, rpcUrl]); // Added missing dependencies

  useEffect(() => {
    const params = `number=${selectedNumber.toString().padStart(2, '0')}&round=${round}&player=${encodeURIComponent(player)}&txHash=${txHash}`;
    const url = `${baseUrl}/share?${params}`;
    setShareUrl(url);

    const imgUrl = `${baseUrl}/api/ticket-image?${params}`;
    setImageUrl(imgUrl);
  }, [selectedNumber, round, player, txHash, baseUrl]); // Added missing dependency

  const castConfig = {
    text: `I just picked number ${selectedNumber.toString().padStart(2, '0')} in MINIIS3 Round ${round}! - @babartos`,
    embeds: [
      shareUrl
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ backgroundImage: `url(/ticket-background.png)` }}>
      <div className="relative bg-transparent backdrop-blur-md border border-white/20 p-4 rounded-lg shadow-lg max-w-sm w-full mx-4">
        <h2 className="text-lg font-bold mb-2 text-white drop-shadow-md">Your Ticket</h2>
        <img src={imageUrl} alt="Ticket" className="w-full max-w-[300px] h-auto mb-4 rounded-md" />
        <div className="flex justify-between gap-2">
          <ShareButton buttonText="Share on Farcaster" cast={castConfig} className="btn btn-primary px-4 py-2 text-white text-center rounded-full" />
          <button onClick={onClose} className="btn bg-gray-700 hover:bg-gray-800 px-4 py-2 text-white text-center rounded-full">Close</button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;