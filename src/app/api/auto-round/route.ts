import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import axios from "axios";
import * as cheerio from "cheerio";
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

async function fetchWinningNumbers() {
  try {
    const response = await axios.get('https://www.minhngoc.net.vn/ket-qua-xo-so/mien-bac.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(response.data);
    const dbNumber = $('table.bkqmienbac tr:nth-child(2) td:nth-child(2)').text().trim().slice(-2) || '';
    const g7Numbers = $('table.bkqmienbac tr:nth-child(9) td:nth-child(2)').text().trim().split(/\s+|-/).filter(n => n.trim() !== '') || [];
    const numbers = [...g7Numbers.slice(0, 4), dbNumber].map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 0 && n < 100);
    return numbers;
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error('Error fetching winners:', message);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const secret = url.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const currentRound = Number(await contract.currentRound());
    const isClosed = await contract.roundClosed(currentRound);

    if (!isClosed) {
      const winners = await fetchWinningNumbers();
      if (winners.length === 5 && winners.every(n => n >= 0 && n < 100)) {
        const nonceSet = await provider.getTransactionCount(wallet.address, 'pending');
        const txSet = await contract.setWinningNumbers(winners, { nonce: nonceSet });
        await txSet.wait();
        console.log(`Round ${currentRound} closed with winners: ${winners}`);

        // Find winners
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
            console.log(`No FID found for address ${addr}`);
          }
        }
      } else {
        throw new Error('Invalid winners data');
      }
    }

    const nonceStart = await provider.getTransactionCount(wallet.address, 'pending');
    const txStart = await contract.startNewRound({ nonce: nonceStart });
    await txStart.wait();
    console.log('New round started');

    return NextResponse.json({ success: true });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }
    console.error('Error in auto-round:', message);
    return NextResponse.json({ error: 'Failed to run auto-round' }, { status: 500 });
  }
}