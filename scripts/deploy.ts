import { ethers, network } from "hardhat";
import { parseEther } from "ethers/lib/utils";

async function main() {
  // Deploy Smart Swap Factory
  let ssfFactory = await ethers.getContractFactory("SmartSwapFactory");
  console.log("Deploying SmartSwap Factory...")
  let smartSwapFactory = await ssfFactory.deploy();
  await smartSwapFactory.deployed();
  console.log(`Deployed contract to: ${smartSwapFactory.address}`);

  // Deploy test tokens only if on a local blockchain
  if(network.config.chainId == 31337) {
    // Deploy TestToken1, TestToken2 and TestToken3
    let tokenFactory = await ethers.getContractFactory("TestToken");
    console.log("Deploying test token 1...")
    let testToken1 = await tokenFactory.deploy("Test token 1", "TT1");
    await testToken1.deployed();
    console.log(`Deployed contract to: ${testToken1.address}`);
    console.log("Deploying test token 2...")
    let testToken2 = await tokenFactory.deploy("Test token 2", "TT2");
    await testToken2.deployed();
    console.log(`Deployed contract to: ${testToken2.address}`);
    console.log("Deploying test token 3...")
    let testToken3 = await tokenFactory.deploy("Test token 3", "TT3");
    await testToken3.deployed();
    console.log(`Deployed contract to: ${testToken3.address}`);

    // Transfer tokens to user
    const [deployer, user] = await ethers.getSigners();
    testToken1.transfer(user.address, parseEther("1000"));
    testToken2.transfer(user.address, parseEther("1000"));
    testToken3.transfer(user.address, parseEther("1000"));

    // Deploy a SmartSwap pool via SmartSwap Factory
    console.log("Deploying SmartSwap pool via SmartSwap Factory...")
    let trx = await smartSwapFactory.createPool(testToken1.address, testToken2.address);
    let transactionReceipt = await trx.wait();
    let poolAddress = transactionReceipt.events[0].args.pool;
    console.log(`Deployed pool to: ${poolAddress}`);
  }
  else {
    let tokenFactory = await ethers.getContractFactory("TestToken");
    console.log("Deploying SmartSwap token...")
    let ssToken = await tokenFactory.deploy("SmartSwap token", "SST");
    await ssToken.deployed();
    console.log(`Deployed contract to: ${ssToken.address}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});