const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS;

const CONTRACT_ABI = [
  'function depositReward(uint256 amount)',
  'function withdrawReward(uint256 amount)',
  'function getPoolBalance() view returns (uint256)',
  'function owner() view returns (address)'
];

const USDC_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main(action, amountUSDC) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  // Check if wallet is owner
  const contractOwner = await contract.owner();
  if (contractOwner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error(`Wallet ${wallet.address} is not the owner of the contract (owner is ${contractOwner})`);
    return;
  }
  console.log(`Wallet ${wallet.address} is confirmed as owner`);

  const amount = ethers.parseUnits(amountUSDC.toString(), 6);

  if (action === 'deposit') {
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);
    const balance = await usdc.balanceOf(wallet.address);
    console.log(`Owner USDC balance: ${ethers.formatUnits(balance, 6)} USDC`);

    if (balance < amount) {
      console.error('Insufficient USDC balance in owner wallet');
      return;
    }

    // Always reset allowance to 0 to avoid any sync issues
    const txReset = await usdc.approve(CONTRACT_ADDRESS, 0, { gasLimit: 200000 });
    console.log(`Reset approve tx hash: ${txReset.hash}`);
    await txReset.wait();
    console.log('Reset allowance to 0');

    // Approve double the amount for safety (avoid unlimited if issue)
    const approveAmount = amount * 2n;
    const txApprove = await usdc.approve(CONTRACT_ADDRESS, approveAmount, { gasLimit: 200000 });
    console.log(`Approve tx hash: ${txApprove.hash}`);
    await txApprove.wait();
    console.log(`Approved USDC (${ethers.formatUnits(approveAmount, 6)} USDC)`);
    await delay(120000); // Increase delay to 120s for mainnet sync

    // Poll allowance until sufficient (max 5 attempts, 10s each)
    let allowance = await usdc.allowance(wallet.address, CONTRACT_ADDRESS);
    let pollCount = 0;
    while (allowance < amount && pollCount < 5) {
      console.log(`Allowance not sufficient yet: ${ethers.formatUnits(allowance, 6)} USDC. Polling again...`);
      await delay(10000); // Wait 10s
      allowance = await usdc.allowance(wallet.address, CONTRACT_ADDRESS);
      pollCount++;
    }
    console.log(`Final allowance: ${ethers.formatUnits(allowance, 6)} USDC`);
    if (allowance < amount) {
      console.error('Allowance still insufficient after polling. Try again later or check RPC.');
      return;
    }

    try {
      const tx = await contract.depositReward(amount, { gasLimit: 500000 });
      console.log(`Deposit tx hash: ${tx.hash}`);
      await tx.wait();
      console.log(`Deposited ${amountUSDC} USDC`);

      const newPool = await contract.getPoolBalance();
      console.log(`New pool balance: ${ethers.formatUnits(newPool, 6)} USDC`);
    } catch (error) {
      console.error('Deposit failed:', error.message);
      if (error.reason) {
        console.error('Revert reason:', error.reason); // Better reason if available
      }
      if (error.data) {
        console.error('Revert data:', error.data);
      }
      // If revert, suggest manual check on Basescan
      console.error('Check tx on Basescan for more details or try increasing delay further.');
    }
  } else if (action === 'withdraw') {
    const tx = await contract.withdrawReward(amount, { gasLimit: 200000 });
    console.log(`Withdraw tx hash: ${tx.hash}`);
    await tx.wait();
    console.log(`Withdrawn ${amountUSDC} USDC`);

    const newPool = await contract.getPoolBalance();
    console.log(`New pool balance: ${ethers.formatUnits(newPool, 6)} USDC`);
  } else if (action === 'check') {
    const balance = await contract.getPoolBalance();
    console.log(`Pool balance: ${ethers.formatUnits(balance, 6)} USDC`);
  }
}

const [_, __, action, amountStr] = process.argv;
const amount = parseFloat(amountStr) || 0;
main(action, amount).catch(console.error);