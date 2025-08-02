const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

const ABI = ['function setBetAmount(uint256 newAmount) external'];

async function main(newBetUSDC) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // Chuyển newBetUSDC thành wei (6 decimals)
    const newAmount = ethers.parseUnits(newBetUSDC.toString(), 6);

    // Fetch nonce mới
    const nonce = await provider.getTransactionCount(wallet.address, 'pending');

    const tx = await contract.setBetAmount(newAmount, { nonce });
    await tx.wait();
    console.log(`Bet amount updated to ${newBetUSDC} USDC`);
  } catch (error) {
    console.error('Error in main:', error.shortMessage || error.message);
  }
}

// Chạy: node scripts/set-bet-amount.js 0.015 (cho 0.015 USDC)
const [_, __, amountStr] = process.argv;
const amount = parseFloat(amountStr) || 0.01;
main(amount).catch(console.error);