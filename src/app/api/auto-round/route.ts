// src/app/api/auto-round/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";
import axios from "axios";
import { sendNeynarMiniAppNotification } from "~/lib/neynar";
import { getFidByAddress, getAllUserFids, deleteParticipants } from "~/lib/kv";
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
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"},{"internalType": "address", "name": "", "type": "address"}],
    "name": "claimed",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
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
    "inputs": [{"internalType": "uint256", "name": "round", "type": "uint256"},{"internalType": "address", "name": "user", "type": "address"}],
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
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"},{"internalType": "uint8", "name": "", "type": "uint8"}],
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
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"},{"internalType": "uint256", "name": "", "type": "uint256"}],
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

const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org';
const privateKey = process.env.PRIVATE_KEY || '';
const neynarEnabled = process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID;

export async function POST(request: NextRequest) {
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    const contract = new ethers.Contract(contractAddress, ABI, wallet);

    const currentRound = Number(await contract.currentRound());
    const isClosed = await contract.roundClosed(currentRound);

    let winners: number[] = [];
    if (!isClosed) {
      const response = await axios.get('https://www.minhngoc.net.vn/getkqxs/mien-bac.json');
      const data = response.data;
      if (!data.mienbac || !data.mienbac.giaidb) {
        throw new Error('Invalid lottery data');
      }
      winners = data.mienbac.giaidb.slice(-2).map(Number);
      if (winners.length !== 5) {
        return NextResponse.json({ error: 'Not enough winning numbers from previous round' }, { status: 200 });
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
    }

    const txStart = await contract.startNewRound();
    await txStart.wait();
    console.log('New round started');

    // New: Reset participants in Redis for the previous round
    await deleteParticipants(currentRound); // Delete old round's participants

    // Tích hợp gửi thông báo vòng chơi mới (broadcast)
    const title = 'New Round Started!';
    const body = 'The new round of MINIIS3 has begun! Pick your lucky number now.';
    let broadcastResult;
    if (neynarEnabled) {
      broadcastResult = await sendNeynarMiniAppNotification({ fids: [], title, body });
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