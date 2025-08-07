// src/components/ShareModal.tsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMiniApp } from '@neynar/react';
import { truncateAddress } from '@/lib/truncateAddress';
import { ShareButton } from './ui/Share';

const ShareModal: React.FC<{ onClose: () => void; selectedNumber: number; txHash: string }> = ({ onClose, selectedNumber, txHash }) => {
  const [round, setRound] = useState(1);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const { address } = useAccount();
  const { context } = useMiniApp();
  const username = context?.user?.username;
  const player = username || truncateAddress(address || '');

  useEffect(() => {
    const updateRound = () => {
      const now = new Date();
      const start = new Date(now);
      start.setUTCHours(12, 30, 0, 0);
      if (now < start) start.setUTCDate(start.getUTCDate() - 1);
      const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      setRound(daysSinceStart);
    };
    updateRound();

    const url = `/share?number=${selectedNumber.toString().padStart(2, '0')}&round=${round}&player=${encodeURIComponent(player)}&txHash=${txHash}`;
    setShareUrl(url);

    const imgUrl = `/api/ticket-image?number=${selectedNumber.toString().padStart(2, '0')}&round=${round}&player=${encodeURIComponent(player)}&txHash=${txHash}`;
    setImageUrl(imgUrl);
  }, [selectedNumber, round, player, txHash]);

  const castConfig = {
    text: `I just picked number ${selectedNumber.toString().padStart(2, '0')} in MINIIS3 Round ${round}!`,
    embeds: [
      shareUrl
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ backgroundImage: `url(/ticket-background.png)` }}>
      <div className="card p-4">
        <h2 className="text-lg font-bold mb-2">Your Ticket</h2>
        <img src={imageUrl} alt="Ticket" className="w-full max-w-[300px] h-auto mb-4" />
        <ShareButton buttonText="Share on Farcaster" cast={castConfig} />
        <button onClick={onClose} className="btn btn-secondary mt-2">Close</button>
      </div>
    </div>
  );
};

export default ShareModal;