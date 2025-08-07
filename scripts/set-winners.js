const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

const ABI = ['function setWinningNumbers(uint8[5] memory _winners) external'];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // Nhập thủ công 5 số từ Results.tsx, ví dụ:
  const winners = [49, 93, 43, 27, 30]; // Array số, không string
  const tx = await contract.setWinningNumbers(winners);
  await tx.wait();
  console.log('Winning numbers set:', winners);
}

main().catch(console.error);