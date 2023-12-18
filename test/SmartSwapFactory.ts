import { expect } from "chai";
import { ethers } from "hardhat";

describe("SmartSwapFactory", function () {

  let smartSwapFactory;
  let token1, token2;
  let zeroAddress = '0x0000000000000000000000000000000000000000';
  beforeEach(async () => {
    let contractFactory = await ethers.getContractFactory("SmartSwapFactory");
    smartSwapFactory = await contractFactory.deploy();
    let tokenContractFactory = await ethers.getContractFactory("TestToken");
    token1 = await tokenContractFactory.deploy("TestToken1", "TT1");
    token2 = await tokenContractFactory.deploy("TestToken2", "TT2");
  });

  describe("Create pool", function () {
    it("Reverts if tokenA == tokenB", async function () {
      await expect(smartSwapFactory.createPool(token1.address, token1.address)).to.be.revertedWith(
        "SmartSwapFactory__NeedTwoDifferentTokens"
      );
    });
    it("Reverts if tokenA == address(0)", async function () {
      await expect(smartSwapFactory.createPool(zeroAddress, token2.address)).to.be.revertedWith(
        "SmartSwapFactory__ZeroTokenError"
      );
    });
    it("Reverts the pool already exists", async function () {
      let transactionResponse = await smartSwapFactory.createPool(token1.address, token2.address);
      await transactionResponse.wait(1);

      await expect(smartSwapFactory.createPool(token1.address, token2.address)).to.be.revertedWith(
        "SmartSwapFactory__PoolAlreadyExists"
      );
    });
    it("Emits PoolCreated event", async function () {
      await expect(smartSwapFactory.createPool(token1.address, token2.address)).to.emit(
        smartSwapFactory,
        "PoolCreated"
      );
    });
    // it("Successfully creates a pool", async function () {
    //   let transactionResponse = await smartSwapFactory.createPool(token1.address, token2.address);
    //   let transactionReceipt = await transactionResponse.wait(1);

    //   //let lpsLength = await smartSwapFactory.allLiquidityPools(0);
    //   console.log(transactionReceipt);
    //   //expect(lpsLength).to.equal(1);
    // });
  });
});
