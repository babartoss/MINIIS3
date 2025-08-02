const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;

const CONTRACT_ABI = [
  'function depositReward(uint256 amount) external',
  'function withdrawReward(uint256 amount) external',
  'function getPoolBalance() view returns (uint256)'
];

const USDC_ABI = ['function approve(address spender, uint256 amount) external returns (bool)'];

async function main(action, amountUSDC) {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

    // Chuyển amountUSDC thành wei (USDC 6 decimals)
    const amount = ethers.parseUnits(amountUSDC.toString(), 6);

    if (action === 'deposit') {
      // Fetch nonce mới cho approve
      const nonceApprove = await provider.getTransactionCount(wallet.address, 'pending');
      
      // Approve USDC với nonce mới
      const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
      const txApprove = await usdc.approve(CONTRACT_ADDRESS, amount, { nonce: nonceApprove });
      await txApprove.wait();
      console.log('Approved USDC');

      // Fetch nonce mới cho deposit (sau approve)
      const nonceDeposit = await provider.getTransactionCount(wallet.address, 'pending');
      
      // Deposit với nonce mới
      const tx = await contract.depositReward(amount, { nonce: nonceDeposit });
      await tx.wait();
      console.log(`Deposited ${amountUSDC} USDC`);
    } else if (action === 'withdraw') {
      const nonceWithdraw = await provider.getTransactionCount(wallet.address, 'pending');
      const tx = await contract.withdrawReward(amount, { nonce: nonceWithdraw });
      await tx.wait();
      console.log(`Withdrawn ${amountUSDC} USDC`);
    } else if (action === 'check') {
      const balance = await contract.getPoolBalance();
      console.log(`Pool balance: ${ethers.formatUnits(balance, 6)} USDC`);
    }
  } catch (error) {
    console.error('Error in main:', error.shortMessage || error.message);
  }
}

// Chạy từ command line: node scripts/manage-pool.js deposit 10 (nạp 10 USDC)
// Hoặc withdraw 5, hoặc check
const [_, __, action, amountStr] = process.argv;
const amount = parseFloat(amountStr) || 0;
main(action, amount).catch(console.error);