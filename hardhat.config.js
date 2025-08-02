require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config(); // Load .env

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: process.env.NEXT_PUBLIC_BASE_RPC_URL || "https://sepolia.base.org",
      accounts: process.env.OWNER_PRIVATE_KEY ? [process.env.OWNER_PRIVATE_KEY] : []
    }
  },
  etherscan: {
    apiKey: "IC5VI6E9IGBF5UVYWIVXST5MWFYCUPR97S", // Single string V2
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};