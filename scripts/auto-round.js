const ethers = require('ethers');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const RPC_URL = process.env.NEXT_PUBLIC_BASE_RPC_URL;
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY;
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS; // Không cần nhưng giữ

const ABI = [ // ABI cần thiết từ MINIIS3.sol
  'function setWinningNumbers(uint8[5] memory _winners) external',
  'function startNewRound() external',
  'function currentRound() view returns (uint256)',
  'function roundClosed(uint256) view returns (bool)'
];

async function fetchWinningNumbers() {
  try {
    const response = await axios.get('https://www.minhngoc.com.vn/ket-qua-xo-so/mien-bac.html', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
    });
    const $ = cheerio.load(response.data);
    const dbNumber = $('table.bkqmienbac tr:nth-child(2) td:nth-child(2)').text().trim().slice(-2) || '';  // Giải đặc biệt, 2 số cuối
    const g7Numbers = $('table.bkqmienbac tr:nth-child(9) td:nth-child(2)').text().trim().split(/\s+|-/).filter(n => n.trim() !== '') || [];  // Giải 7, split linh hoạt
    const numbers = [...g7Numbers.slice(0, 4), dbNumber].map(n => parseInt(n, 10)).filter(n => !isNaN(n) && n >= 0 && n < 100);  // 4 giải 7 + 1 DB, lọc valid uint8
    return numbers;
  } catch (error) {
    console.error('Error fetching winners:', error.message);
    return [];
  }
}

async function main() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    const currentRound = await contract.currentRound();
    const isClosed = await contract.roundClosed(currentRound);

    if (!isClosed) {
      // Fetch kết quả sau giờ (giả sử script chạy sau 11:15 UTC)
      const winners = await fetchWinningNumbers();
      if (winners.length === 5 && winners.every(n => n >= 0 && n < 100)) {
        // Fetch nonce cho setWinningNumbers
        const nonceSet = await provider.getTransactionCount(wallet.address, 'pending');
        const txSet = await contract.setWinningNumbers(winners, { nonce: nonceSet });
        await txSet.wait();
        console.log(`Round ${currentRound} closed with winners: ${winners}`);
      } else {
        console.error('Invalid winners data');
        return;
      }
    }

    // Fetch nonce cho startNewRound
    const nonceStart = await provider.getTransactionCount(wallet.address, 'pending');
    // Mở round mới
    const txStart = await contract.startNewRound({ nonce: nonceStart });
    await txStart.wait();
    console.log('New round started');
  } catch (error) {
    console.error('Error in main:', error.shortMessage || error.message);
  }
}

// Phần cron tự động
const cron = require('cron');
const job = new cron.CronJob('30 11 * * *', main, null, true, 'UTC'); // Chạy 11:30 UTC hàng ngày (18:30 VN)
job.start();
console.log('Cron job started: Auto-round will run daily at 11:30 UTC');