import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

async function main() {
  // Deploy Smart Swap Factory
  let ssfFactory = await ethers.getContractFactory("SmartSwapFactory");
  console.log("Deploying SmartSwap Factory...")
  let smartSwapFactory = await ssfFactory.deploy();
  await smartSwapFactory.deployed();
  console.log(`Deployed contract to: ${smartSwapFactory.address}`);

  // Deploy TestToken1 and TestToken2
  let tokenFactory = await ethers.getContractFactory("TestToken");
  console.log("Deploying test token 1...")
  let testToken1 = await tokenFactory.deploy("Test token 1", "TT1");
  await testToken1.deployed();
  console.log(`Deployed contract to: ${testToken1.address}`);
  console.log("Deploying test token 2...")
  let testToken2 = await tokenFactory.deploy("Test token 2", "TT2");
  await testToken2.deployed();
  console.log(`Deployed contract to: ${testToken2.address}`);

  // Deploy a SmartSwap pool via SmartSwap Factory
  console.log("Deploying SmartSwap pool via SmartSwap Factory...")
  let trx = await smartSwapFactory.createPool(testToken1.address, testToken2.address);
  let transactionReceipt = await trx.wait();
  let poolAddress = transactionReceipt.events[0].args.pool;
  console.log(`Deployed pool to: ${poolAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
