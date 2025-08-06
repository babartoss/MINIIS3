require('@nomicfoundation/hardhat-toolbox');
require('dotenv').config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    base: { // Chỉ giữ mainnet
      url: "https://mainnet.base.org",
      accounts: [process.env.OWNER_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: "7YJY62F27FFB262MDJH52GKZ9N1U1DJES2", // Giữ
    customChains: [
      {
        network: "base",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org"
        }
      }
    ]
  }
};