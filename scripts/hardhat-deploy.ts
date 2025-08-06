const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Từ env, mainnet
    const MINIIS3 = await ethers.getContractFactory("MINIIS3");
    const miniis3 = await MINIIS3.deploy(USDC_ADDRESS);
    await miniis3.waitForDeployment();
    console.log("Contract deployed to:", await miniis3.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});