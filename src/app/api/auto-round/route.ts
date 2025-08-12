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

      if (!data.success || !data.t || !data.t.issueList || data.t.issueList.length === 0) {
        throw new Error('Invalid API response: success=false or missing issueList');
      }

      const latest = data.t.issueList[0];
      let detailArray: string[];
      try {
        detailArray = JSON.parse(latest.detail);
      } catch (parseError) {
        throw new Error('Failed to parse detail string as JSON');
      }

      if (!detailArray || detailArray.length < 8) {
        throw new Error('Invalid detail array length');
      }

      const dbNumber = detailArray[0].slice(-2);
      const g7Text = detailArray[7];
      const g7Numbers = g7Text.split(',').map(n => n.trim()).filter(n => n.length === 2 && /^\d{2}$/.test(n));

      const numbers = [...g7Numbers, dbNumber].map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 0 && n < 100);

      if (numbers.length === 5) {
        console.log(`Fetched valid numbers: ${numbers}`);
        return numbers;
      }

      console.log(`Attempt ${attempt + 1} failed: Invalid numbers`, numbers);
      await new Promise(resolve => setTimeout(resolve, 300000)); // 5 min retry
    } catch (error: any) {
      console.error('API error:', error.message || error);
    }
  }
  console.error('All attempts failed to fetch valid numbers');
  return [];
}

export async function GET(request: NextRequest) {
  // Check Bearer token from header Authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader ? authHeader.split('Bearer ')[1] : null;

  if (!token || token !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check time: Only run if after 12:00 UTC
  const now = new Date();
  const utcHour = now.getUTCHours();
  const utcMinute = now.getUTCMinutes();
  if (utcHour < 12 || (utcHour === 12 && utcMinute < 0)) {
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
        console.error('Failed to fetch valid winners after retries');
        return NextResponse.json({ success: false, message: 'Invalid winners data after retries' }, { status: 500 });
      }
      // Đề xuất an toàn: Check if winners all zero (invalid)
      const isAllZero = winners.every(n => n === 0);
      if (isAllZero) {
        console.error('Winners all zero - invalid, skipping set');
        return NextResponse.json({ success: false, message: 'Invalid all-zero winners' }, { status: 200 });
      }

      // Thêm check ngăn set winners lặp (so sánh với round trước)
      if (currentRound > 1) {
        const prevWinners: number[] = [];  // Fix: Explicit type number[] để tránh error implicit any[]
        for (let i = 0; i < 5; i++) {
          prevWinners.push(Number(await contract.winningNumbers(currentRound - 1, i)));
        }
        const isSameAsPrev = winners.every((num, idx) => num === prevWinners[idx]);
        if (isSameAsPrev) {
          console.log(`Winners for round ${currentRound} same as round ${currentRound - 1}, skipping set`);
          return NextResponse.json({ success: false, message: 'Winners identical to previous round' }, { status: 200 });
        }
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
      // Đề xuất: Log winnersMap size để debug
      console.log(`Winners map size for round ${currentRound}: ${winnersMap.size}`);

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
  } catch (error: any) {
    console.error('Auto-round error:', error.message || error);
    return NextResponse.json({ error: 'Failed to run auto-round' }, { status: 500 });
  }
}