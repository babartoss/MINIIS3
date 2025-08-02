const axios = require('axios'); // Cài nếu chưa: npm install axios

const API_KEY = 'IC5VI6E9IGBF5UVYWIVXST5MWFYCUPR97S'; // API key cậu
const CONTRACT_ADDRESS = '0x6DC8AF8c64aE8c53aCb2F0756552b24355c8c729'; // Hợp đồng cậu
const CHAIN_ID = 84532; // Base Sepolia

async function queryAPI(module, action) {
  const url = `https://api.etherscan.io/v2/api?chainid=${CHAIN_ID}&module=${module}&action=${action}&address=${CONTRACT_ADDRESS}&tag=latest&apikey=${API_KEY}`;
  try {
    const response = await axios.get(url);
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Ví dụ query balance
queryAPI('account', 'balance');
// Query tx: queryAPI('account', 'txlist');
// Query source: queryAPI('contract', 'getsourcecode');