const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

const ABI = ['function setRewardPerMatch(uint256 newReward) external'];

async function main(newRewardUSDC) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Chuyển newRewardUSDC thành wei (6 decimals)
    const newReward = ethers.parseUnits(newRewardUSDC.toString(), 6);

    // Fetch nonce mới
    const nonce = await provider.getTransactionCount(wallet.address, 'pending');

    const tx = await contract.setRewardPerMatch(newReward, { nonce });
    await tx.wait();
    console.log(`Reward per match updated to ${newRewardUSDC} USDC`);
  } catch (error) {
    console.error('Error in main:', error.shortMessage || error.message);
  }
}

// Chạy: node scripts/set-reward.js 0.40 (cho 0.40 USDC)
const [_, __, amountStr] = process.argv;
const amount = parseFloat(amountStr) || 0.20;
main(amount).catch(console.error);