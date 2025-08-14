// src/app/api/auto-round/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import axios from "axios";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { getFidByAddress, getAllUserFids } from "~/lib/kv";
import { sendNeynarMiniAppNotification } from "~/lib/neynar";
import { sendMiniAppNotification } from "~/lib/notifs";

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
    "inputs": [],
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
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}, {"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "winningNumbers",
    "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}],
    "name": "withdrawReward",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const neynarEnabled = !!process.env.NEYNAR_API_KEY && !!process.env.NEYNAR_CLIENT_ID;
  const ownerPrivateKey = process.env.OWNER_PRIVATE_KEY;
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';

  if (!ownerPrivateKey || !contractAddress) {
    return NextResponse.json({ error: 'Missing environment variables' }, { status: 500 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(ownerPrivateKey, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    const currentRound = Number(await contract.currentRound());

    const result = await axios.get('https://www.minhngoc.net.vn/getkqxs/mien-bac.json');
    const special = result.data.data.gdb.substring(4, 6);
    const first = result.data.data.g1.substring(4, 6);
    const second = result.data.data.g2[0].substring(4, 6);
    const third = result.data.data.g3[0].substring(4, 6);
    const fourth = result.data.data.g4[0].substring(4, 6);
    const winners = [parseInt(special), parseInt(first), parseInt(second), parseInt(third), parseInt(fourth)];

    if (winners.some(isNaN)) {
      console.error('Invalid winners:', winners);
      return NextResponse.json({ success: false, message: 'Invalid winners' }, { status: 200 });
    }
    if (winners.every(num => num === 0)) {
      console.error('Winners all zero - invalid, skipping set');
      return NextResponse.json({ success: false, message: 'Invalid all-zero winners' }, { status: 200 });
    }
    if (currentRound > 1) {
      const prevWinners: number[] = [];
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

    const winningSet = new Set(winners);
    const winnersMap = new Map<string, number>();
    for (let num = 0; num < 100; num++) {
      const addr = await contract.selectedNumbers(currentRound, num);
      if (addr !== ethers.ZeroAddress && winningSet.has(num)) {
        const currentMatches = winnersMap.get(addr) || 0;
        winnersMap.set(addr, currentMatches + 1);
      }
    }
    console.log(`Winners map size for round ${currentRound}: ${winnersMap.size}`);

    const rewardPerMatch = Number(await contract.rewardPerMatch());
    for (const [addr, matches] of winnersMap.entries()) {
      const fid = await getFidByAddress(addr);
      if (fid) {
        const amount = (matches * rewardPerMatch) / 1e6;
        const result = await sendNeynarMiniAppNotification({
          fids: [fid],
          title: "Congratulations! You won in MINIIS3",
          body: `You matched ${matches} numbers and won ${amount} USDC. Go to the app to claim your reward.`,
        });
        console.log(`Notification sent to FID ${fid}:`, result);
      } else {
        console.log(`No FID for address ${addr}`);
      }
    }

    const txStart = await contract.startNewRound();
    await txStart.wait();
    console.log('New round started');

    // Tích hợp gửi thông báo vòng chơi mới (broadcast đến tất cả users đã add mini app)
    const title = 'New Round Started!';
    const body = 'The new round of MINIIS3 has begun! Pick your lucky number now.';
    let broadcastResult;
    if (neynarEnabled) {
      broadcastResult = await sendNeynarMiniAppNotification({ fids: [], title, body }); // fids: [] để gửi đến all users đã add và enabled notifications
    } else {
      const fids = await getAllUserFids();
      broadcastResult = [];
      for (const fid of fids) {
        const res = await sendMiniAppNotification({ fid, title, body });
        broadcastResult.push({ fid, res });
      }
    }
    console.log('Broadcast notification result:', broadcastResult);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Auto-round error:', error.message || error);
    return NextResponse.json({ error: 'Failed to run auto-round' }, { status: 500 });
  }
}