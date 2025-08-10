// File: miniis3\src\app\api\auto-round\route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import axios from "axios";
import { sendNeynarMiniAppNotification } from "~/lib/neynar";
import { getFidByAddress } from "~/lib/kv";

// ABI đầy đủ từ contract
const ABI = [
  {
    "inputs": [{"internalType": "address", "name": "_usdc", "type": "address"}],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "newAmount", "type": "uint256"}],
    "name": "BetAmountUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "Deposited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "round", "type": "uint256"},
      {"indexed": false, "internalType": "uint8[5]", "name": "winners", "type": "uint8[5]"}
    ],
    "name": "RoundEnded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "round", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "claimant", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "RewardClaimed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "newReward", "type": "uint256"}],
    "name": "RewardPerMatchUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": false, "internalType": "uint256", "name": "round", "type": "uint256"},
      {"indexed": false, "internalType": "address", "name": "selector", "type": "address"},
      {"indexed": false, "internalType": "uint8", "name": "number", "type": "uint8"}
    ],
    "name": "NumberSelected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "Withdrawn",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "betAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "round", "type": "uint256"}],
    "name": "claimReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "address", "name": "", "type": "address"}],
    "name": "claimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentRound",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "depositReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPoolBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "round", "type": "uint256"}, {"internalType": "address", "name": "user", "type": "address"}],
    "name": "hasClaimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "poolBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "renounceOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "rewardPerMatch",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "roundClosed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8", "name": "number", "type": "uint8"}],
    "name": "selectNumber",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "selectedCount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint8", "name": "", "type": "uint8"}],
    "name": "selectedNumbers",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newAmount", "type": "uint256"}],
    "name": "setBetAmount",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "newReward", "type": "uint256"}],
    "name": "setRewardPerMatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint8[5]", "name": "_winners", "type": "uint8[5]"}],
    "name": "setWinningNumbers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startNewRound",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "newOwner", "type": "address"}],
    "name": "transferOwnership",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdc",
    "outputs": [{"internalType": "contract IERC20", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdrawReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "winningNumbers",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL || '';
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || '';

async function fetchWinningNumbers(retries = 3): Promise<number[]> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await axios.get('https://xoso188.net/api/front/open/lottery/history/list/5/miba', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const data = response.data;
      if (!data.t || !data.t.issueList || data.t.issueList.length === 0) throw new Error('Invalid API response');
      const latest = data.t.issueList[0]; // Latest result
      const dbNumber = latest.detail[0].slice(-2); // Special prize (detail[0] = DB string)
      const g7Text = latest.detail[7]; // Seventh prize (detail[7] = "35,28,81,82")
      const g7Numbers = g7Text.split(',').filter((n: string) => n.trim().length === 2 && /^\d{2}$/.test(n.trim()));
      const numbers = [...g7Numbers, dbNumber].map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 0 && n < 100);
      if (numbers.length === 5) return numbers;
      console.log(`Attempt ${attempt + 1} failed: Invalid numbers`, numbers);
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min retry
    } catch (error) {
      console.error('API error:', error);
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  // Check Bearer token from header Authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split('Bearer ')[1] : null;

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check time: Only run if after 11:30 UTC
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  if (utcHour < 11 || (utcHour === 11 && utcMinute < 30)) {
    return NextResponse.json({ success: false, message: 'Too early for results' }, { status: 200 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const currentRound = Number(await contract.currentRound());
    const isClosed = await contract.roundClosed(currentRound);

    if (!isClosed) {
      const winners = await fetchWinningNumbers();
      if (winners.length !== 5) {
        throw new Error('Invalid winners data after retries');
      }
      const txSet = await contract.setWinningNumbers(winners);
      await txSet.wait();
      console.log(`Round ${currentRound} closed with winners: ${winners}`);

      // Filter winners and notify
      const winningSet = new Set(winners);
      const winnersMap = new Map<string, number>();
      for (let num = 0; num < 100; num++) {
        const addr = await contract.selectedNumbers(currentRound, num);
        if (addr !== ethers.ZeroAddress && winningSet.has(num)) {
          const currentMatches = winnersMap.get(addr) || 0;
          winnersMap.set(addr, currentMatches + 1);
        }
      }

      const rewardPerMatch = Number(await contract.rewardPerMatch());
      for (const [addr, matches] of winnersMap.entries()) {
        const fid = await getFidByAddress(addr);
        if (fid) {
          const amount = (matches * rewardPerMatch) / 1e6; // USDC 6 decimals
          const result = await sendNeynarMiniAppNotification({
            fid,
            title: "Congratulations! You won in MINIIS3",
            body: `You matched ${matches} numbers and won ${amount} USDC. Go to the app to claim your reward.`,
          });
          console.log(`Notification sent to FID ${fid}:`, result);
        } else {
          console.log(`No FID for address ${addr}`);
        }
      }
    }

    // Always start new round (if closed or after close)
    const txStart = await contract.startNewRound();
    await txStart.wait();
    console.log('New round started');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Auto-round error:', error);
    return NextResponse.json({ error: 'Failed to run auto-round' }, { status: 500 });
  }
}