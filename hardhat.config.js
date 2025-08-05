require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: { // Giữ testnet
      url: "https://sepolia.base.org",
      accounts: [process.env.OWNER_PRIVATE_KEY]
    },
    base: { // Thêm mainnet
      url: "https://mainnet.base.org",
      accounts: [process.env.OWNER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: "IC5VI6E9IGBF5UVYWIVXST5MWFYCUPR97S", // Giữ
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      },
      { // Giữ Sepolia
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