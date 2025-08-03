import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWriteContract } from 'wagmi';
import { useSignIn } from '@farcaster/auth-kit'; // Correct import for getting user data
import ApproveModal from './ApproveModal';
import ShareModal from './ShareModal';

const Board: React.FC = () => {
  const { address: userAddress, isConnected } = useAccount();
  const { data: userData } = useSignIn({}); // Use useSignIn to get user data
  const fid = userData?.fid; // FID của user hiện tại

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showApprove, setShowApprove] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isBetClosed, setIsBetClosed] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const numbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));

  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;
  const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '') as `0x${string}`;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://sepolia.base.org';
  const betCloseStart = parseInt(process.env.NEXT_PUBLIC_BET_CLOSE_START_HOUR || '11');
  const betCloseEnd = parseInt(process.env.NEXT_PUBLIC_BET_CLOSE_END_HOUR || '12');

  const { writeContractAsync: selectNumAsync } = useWriteContract();
  const { writeContractAsync: approveUSDCAsync } = useWriteContract();

  useEffect(() => {
    const checkClosingTime = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      setIsBetClosed(utcHour >= betCloseStart && utcHour < betCloseEnd);
    };

    checkClosingTime();
    const interval = setInterval(checkClosingTime, 60000);
    return () => clearInterval(interval);
  }, [betCloseStart, betCloseEnd]);

  useEffect(() => {
    const fetchSelected = async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function selectedNumbers(uint256, uint8) view returns (address)',
        'function currentRound() view returns (uint256)'
      ], provider);
      const currentRound = await contract.currentRound();
      const selected = new Set<number>();
      for (let i = 0; i < 100; i++) {
        const addr = await contract.selectedNumbers(currentRound, i);
        if (addr !== ethers.ZeroAddress) selected.add(i);
      }
      setSelectedNumbers(selected);
    };

    fetchSelected();
    const interval = setInterval(fetchSelected, 30000);
    return () => clearInterval(interval);
  }, [contractAddress, rpcUrl]);

  const handleSelect = (num: string) => {
    if (isBetClosed || selectedNumbers.has(parseInt(num)) || !isConnected) return;
    setSelectedNumber(parseInt(num));
    setShowApprove(true);
  };

  const handleConfirm = async () => {
    if (isBetClosed || !selectedNumber || !userAddress) return;

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const usdcContract = new ethers.Contract(usdcAddress, [
      'function allowance(address owner, address spender) view returns (uint256)'
    ], provider);
    const allowance = await usdcContract.allowance(userAddress, contractAddress);

    try {
      if (allowance < BigInt(10000)) {
        const approveHash = await approveUSDCAsync({
          address: usdcAddress,
          abi: ['function approve(address spender, uint256 amount) public returns (bool)'],
          functionName: 'approve',
          args: [contractAddress, BigInt(10000)],
        });
        console.log('Approve tx hash:', approveHash);
      }

      const selectHash = await selectNumAsync({
        address: contractAddress,
        abi: ['function selectNumber(uint8)'],
        functionName: 'selectNumber',
        args: [selectedNumber],
      });

      setTxHash(selectHash);
      setSelectedNumbers(prev => new Set([...prev, selectedNumber!]));
      setShowApprove(false);
      setShowShare(true);

      // New: Record mapping address -> FID sau tx success
      if (userAddress && fid) {
        try {
          await fetch('/api/record-selection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fid, address: userAddress }),
          });
          console.log('Mapping recorded for address:', userAddress);
        } catch (error) {
          console.error('Error recording mapping:', error);
        }
      }
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  };

  return (
    <div 
      className="p-2 sm:p-4 flex flex-col items-center justify-center overflow-hidden"
      style={{
        backgroundImage: `url('/board.png')`,
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        minHeight: 'auto',
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <div className="grid grid-cols-10 gap-1 sm:gap-2 auto-rows-fr max-w-[640px] mx-auto mb-4">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => handleSelect(num)}
            className={`aspect-square flex items-center justify-center text-base font-bold rounded-lg relative shadow-md p-1 sm:p-2 ${isBetClosed || selectedNumbers.has(parseInt(num)) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-200'} bg-primary text-white`}
            disabled={isBetClosed || selectedNumbers.has(parseInt(num))}
          >
            {num}
            {selectedNumbers.has(parseInt(num)) && <span className="absolute top-0 right-0 text-green-500 text-xs sm:text-sm">✅</span>}
          </button>
        ))}
      </div>
      <div className="flex justify-center mb-4">
        <a 
          href="https://www.minhngoc.net.vn/ket-qua-xo-so/mien-bac.html" 
          className="btn btn-secondary text-base px-4 py-2"
        >
          Check Results Online
        </a>
      </div>
      {showApprove && <ApproveModal onApprove={handleConfirm} onClose={() => setShowApprove(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} selectedNumber={selectedNumber!} txHash={txHash!} />}
    </div>
  );
};

export default Board;