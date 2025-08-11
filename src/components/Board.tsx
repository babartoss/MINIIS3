// src/components/Board.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useAccount, useWriteContract, useChainId, useSwitchChain, useWaitForTransactionReceipt, useConnect } from 'wagmi';
import { useMiniApp } from '@neynar/react';
import ShareModal from './ShareModal'; // Giữ ShareModal
import { base } from 'wagmi/chains';

const Board: React.FC = () => {
  const { address: userAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { connect, connectors } = useConnect();

  const { context } = useMiniApp();
  const fid = context?.user?.fid; // Thay nguồn FID từ context

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false); // New: Modal confirm
  const [showShare, setShowShare] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [approveHash, setApproveHash] = useState<string | null>(null);
  const [selectHash, setSelectHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false); // New: Loading state
  const [isBetClosed, setIsBetClosed] = useState(false);
  const [isRoundClosed, setIsRoundClosed] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [currentRound, setCurrentRound] = useState<number>(0);
  const numbers = Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));

  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '') as `0x${string}`;
  const usdcAddress = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '') as `0x${string}`;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  const { writeContractAsync: selectNumAsync } = useWriteContract();
  const { writeContractAsync: approveUSDCAsync } = useWriteContract();

  const approveReceipt = useWaitForTransactionReceipt({
    hash: approveHash as `0x${string}` | undefined,
  });

  const selectReceipt = useWaitForTransactionReceipt({
    hash: selectHash as `0x${string}` | undefined,
  });

  // Auto-connect useEffect
  useEffect(() => {
    const isInFarcasterClient = typeof window !== 'undefined' && 
      (window.location.href.includes('warpcast.com') || 
       window.location.href.includes('farcaster') ||
       window.ethereum?.isFarcaster ||
       context?.client);
    
    if (fid && !isConnected && connectors.length > 0 && isInFarcasterClient) {
      console.log("Auto-connecting Farcaster wallet in Board...");
      try {
        connect({ connector: connectors[0] });
      } catch (error) {
        console.error("Auto-connect failed in Board:", error);
        setErrorMessage('Auto-connect wallet failed. Please connect manually.');
      }
    }
  }, [fid, isConnected, connectors, connect, context?.client]);

  // Set address-FID mapping after connection
  useEffect(() => {
    if (isConnected && fid && userAddress) {
      fetch('/api/set-address-fid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: userAddress, fid }),
      }).catch(err => console.error('Failed to set address-FID mapping:', err));
    }
  }, [isConnected, fid, userAddress]);

  // Check thời gian đóng (đồng bộ với backend, khóa từ 11:00 UTC đến 12:30 UTC)
  useEffect(() => {
    const checkClosingTime = () => {
      const now = new Date();
      const utcHour = now.getUTCHours();
      const utcMinute = now.getUTCMinutes();
      const isClosed = 
        (utcHour === 11 && utcMinute >= 0) ||  // Bắt đầu đóng lúc 11:00
        (utcHour === 12 && utcMinute < 30);   // Kết thúc lúc 12:30
      setIsBetClosed(isClosed);
    };

    checkClosingTime();
    const interval = setInterval(checkClosingTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch selectedNumbers, roundClosed, and currentRound
  useEffect(() => {
    const fetchData = async () => {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const contract = new ethers.Contract(contractAddress, [
        'function selectedNumbers(uint256, uint8) view returns (address)',
        'function currentRound() view returns (uint256)',
        'function roundClosed(uint256) view returns (bool)'
      ], provider);
      const currRound = await contract.currentRound();
      setCurrentRound(Number(currRound));
      setIsRoundClosed(await contract.roundClosed(currRound));
      const selected = new Set<number>();
      for (let i = 0; i < 100; i++) {
        const addr = await contract.selectedNumbers(currRound, i);
        if (addr !== ethers.ZeroAddress) selected.add(i);
      }
      setSelectedNumbers(selected);
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [contractAddress, rpcUrl]);

  useEffect(() => {
    if (approveHash && approveReceipt.isSuccess && selectedNumber !== null && userAddress) {
      (async () => {
        try {
          console.log('Approve confirmed, selecting number');
          const hash = await selectNumAsync({
            address: contractAddress,
            abi: [
              {
                name: 'selectNumber',
                type: 'function',
                inputs: [{ name: 'number', type: 'uint8' }],
                outputs: [],
                stateMutability: 'nonpayable',
              },
            ],
            functionName: 'selectNumber',
            args: [selectedNumber],
          });
          setSelectHash(hash);
        } catch (error: any) {
          console.error('Select failed:', error);
          setErrorMessage(`Select number failed: ${error.message || 'Unknown error'}`);
          setApproveHash(null);
          setIsProcessing(false); // Reset loading
        }
      })();
    } else if (approveHash && approveReceipt.isError) {
      setErrorMessage('Approve transaction failed.');
      setApproveHash(null);
      setIsProcessing(false);
    }
  }, [approveReceipt.isSuccess, approveReceipt.isError, approveHash, selectedNumber, userAddress, selectNumAsync, contractAddress]);

  useEffect(() => {
    if (selectHash && selectReceipt.isSuccess) {
      const timestamp = new Date().toLocaleString();
      const title = "Bet Placed Successfully!";
      const body = `You selected number ${selectedNumber?.toString().padStart(2, '0')} for round ${currentRound} at ${timestamp}`;

      fetch('/api/send-custom-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid, title, body }),
      }).catch(err => console.error('Send notification failed:', err));

      setTxHash(selectHash);
      setShowShare(true);
      setSelectHash(null);
      setIsProcessing(false);
    } else if (selectHash && selectReceipt.isError) {
      setErrorMessage('Select transaction failed.');
      setSelectHash(null);
      setIsProcessing(false);
    }
  }, [selectReceipt.isSuccess, selectReceipt.isError, selectHash, selectedNumber, currentRound, fid]);

  const handleSelect = (num: string) => {
    if (isBetClosed || isRoundClosed || selectedNumbers.has(parseInt(num)) || !isConnected || isProcessing) return;
    setSelectedNumber(parseInt(num));
    setShowConfirm(true); // Show modal confirm instead of direct confirm
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    if (isBetClosed || isRoundClosed || !selectedNumber || !userAddress || !isConnected) {
      setErrorMessage('Bet closed, round ended, or invalid state.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true); // Start loading
    console.log('Starting handleConfirm - Chain ID:', chainId, 'Connected:', isConnected);

    if (chainId !== base.id) {
      console.log('Switching to Base Mainnet');
      try {
        await switchChain({ chainId: base.id });
      } catch (error: any) {
        console.error('Switch chain failed:', error);
        setErrorMessage(`Failed to switch chain: ${error.message || 'Unknown error. Ensure wallet supports Base mainnet.'}`);
        setIsProcessing(false);
        return;
      }
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const usdcContract = new ethers.Contract(usdcAddress, [
      'function allowance(address owner, address spender) view returns (uint256)',
      'function balanceOf(address account) view returns (uint256)'
    ], provider);

    try {
      const allowance = await usdcContract.allowance(userAddress, contractAddress);
      const balance = await usdcContract.balanceOf(userAddress);
      console.log('USDC Balance:', balance.toString(), 'Allowance:', allowance.toString());

      if (balance < BigInt(10000)) {
        setErrorMessage('Insufficient USDC balance (need at least 0.01 USDC).');
        setIsProcessing(false);
        return;
      }

      if (allowance < BigInt(10000)) {
        console.log('Approving USDC');
        const hash = await approveUSDCAsync({
          address: usdcAddress,
          abi: [
            {
              name: 'approve',
              type: 'function',
              inputs: [
                { name: 'spender', type: 'address' },
                { name: 'amount', type: 'uint256' }
              ],
              outputs: [{ name: '', type: 'bool' }],
              stateMutability: 'nonpayable',
            },
          ],
          functionName: 'approve',
          args: [contractAddress, BigInt(10000)],
        });
        console.log('Approve tx hash:', hash);
        setApproveHash(hash);
      } else {
        console.log('No approve needed, selecting number');
        const hash = await selectNumAsync({
          address: contractAddress,
          abi: [
            {
              name: 'selectNumber',
              type: 'function',
              inputs: [{ name: 'number', type: 'uint8' }],
              outputs: [],
              stateMutability: 'nonpayable',
            },
          ],
          functionName: 'selectNumber',
          args: [selectedNumber],
        });
        setSelectHash(hash);
      }
    } catch (error: any) {
      console.error('Transaction or query failed:', error);
      setErrorMessage(`Failed: ${error.message || 'Check if contract is deployed on mainnet and addresses are correct.'}`);
      setIsProcessing(false);
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
      {!isConnected && (
        <button 
          onClick={() => connect({ connector: connectors[0] })} 
          className="btn btn-primary mb-4"
        >
          Connect Wallet
        </button>
      )}
      {errorMessage && <div className="bg-red-500 text-white p-2 mb-4 rounded">{errorMessage}</div>}
      {isProcessing && <div className="bg-blue-500 text-white p-2 mb-4 rounded">Processing transaction... Please wait.</div>}
      <div className="grid grid-cols-10 gap-1 sm:gap-2 auto-rows-fr max-w-[640px] mx-auto mb-4">
        {numbers.map(num => (
          <button
            key={num}
            onClick={() => handleSelect(num)}
            className={`aspect-square flex items-center justify-center text-base font-bold rounded-lg relative shadow-md p-1 sm:p-2 ${isBetClosed || isRoundClosed || selectedNumbers.has(parseInt(num)) || !isConnected || isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark hover:scale-105 active:scale-95 transition-all duration-200'} bg-primary text-white`}
            disabled={isBetClosed || isRoundClosed || selectedNumbers.has(parseInt(num)) || !isConnected || isProcessing}
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

      {/* New: Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Confirm Selection</h2>
            <p>Select number {selectedNumber?.toString().padStart(2, '0')} for 0.01 USDC?</p>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary mr-2">Cancel</button>
              <button onClick={handleConfirm} className="btn btn-primary">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showShare && <ShareModal onClose={() => setShowShare(false)} selectedNumber={selectedNumber!} txHash={txHash!} />}
    </div>
  );
};

export default Board;