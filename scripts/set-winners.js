const ethers = require('ethers');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;

const ABI = [
  'function setWinningNumbers(uint8[5] memory _winners) external',
  'function roundClosed(uint256) view returns (bool)'
];

async function setWinnersForRound(round, winners) {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const isClosed = await contract.roundClosed(round);
  if (!isClosed) {
    const tx = await contract.setWinningNumbers(winners);
    await tx.wait();
    console.log(`Winning numbers set for round ${round}: ${winners}`);
  } else {
    console.log(`Round ${round} already closed, skipping`);
  }
}

async function main() {
  // Chạy cho round 6
  // THAY ĐỔI: Thay winners thực tế cho round 6 (kết quả XSMB ngày 09/08/2025, ví dụ: [23, 45, 67, 89, 12])
  await setWinnersForRound(6, [23, 45, 67, 89, 12]);

  // Chạy cho round 5
  // THAY ĐỔI: Thay winners thực tế cho round 5 (kết quả XSMB ngày 08/08/2025, ví dụ: [15, 27, 33, 41, 58])
  await setWinnersForRound(5, [15, 27, 33, 41, 58]);

  // Chạy cho round 4
  // THAY ĐỔI: Thay winners thực tế cho round 4 (kết quả XSMB ngày 07/08/2025, ví dụ: [31, 44, 56, 78, 90])
  await setWinnersForRound(4, [31, 44, 56, 78, 90]);

  // Chạy cho round 3
  // THAY ĐỔI: Thay winners thực tế cho round 3 (kết quả XSMB ngày 06/08/2025, ví dụ: [11, 22, 34, 55, 66])
  await setWinnersForRound(3, [11, 22, 34, 55, 66]);
}

main().catch(console.error);