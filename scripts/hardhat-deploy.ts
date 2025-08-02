const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    const USDC_ADDRESS = process.env.USDC_ADDRESS || "0x036CbD53842c5426634e7929541eC2318f3dCF7e"; // Từ env, testnet/mainnet
    const MINIIS3 = await ethers.getContractFactory("MINIIS3");
    const miniis3 = await MINIIS3.deploy(USDC_ADDRESS);
    await miniis3.waitForDeployment();
    console.log("Contract deployed to:", await miniis3.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});