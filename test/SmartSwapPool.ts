import { expect } from "chai";
import { BigNumber } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

describe("SmartSwapPool", function () {
  let deployer, user;
  let smartSwapPool;
  let token1, token2;
  let deployerT1Amount: BigNumber, deployerT2Amount: BigNumber;
  let zeroAddress = '0x0000000000000000000000000000000000000000';
  beforeEach(async () => {
    [deployer, user] = await ethers.getSigners();
    let t1ContractFactory = await ethers.getContractFactory("TestToken1");
    token1 = await t1ContractFactory.deploy();
    let t2ContractFactory = await ethers.getContractFactory("TestToken2");
    token2 = await t2ContractFactory.deploy();

    let contractFactory = await ethers.getContractFactory("SmartSwapPool");
    smartSwapPool = await contractFactory.deploy(token1.address, token2.address);
  });

  describe("Init", function () {
    it("Reverts if tokens not approved", async function () {
      await expect(smartSwapPool.init(parseEther("100"), parseEther("100"))).to.be.revertedWith(
        "ERC20InsufficientAllowance"
      );
    });
    it("Reverts if has liquidity (already initialized)", async function () {
      // Approve tokens
      let trx1 = await token1.approve(smartSwapPool.address, parseEther("100"));
      let trx2 = await token2.approve(smartSwapPool.address, parseEther("100"));
      await trx1.wait(1);
      await trx2.wait(1);

      let transactionResponse = await smartSwapPool.init(parseEther("100"), parseEther("100"));
      await transactionResponse.wait(1);

      await expect(smartSwapPool.init(parseEther("100"), parseEther("100"))).to.be.revertedWith(
        "SmartSwapPool__AlreadyHasLiquidity"
      );
    });
    it("Adds liquidity", async function () {
      // Approve tokens
      let trx1 = await token1.approve(smartSwapPool.address, parseEther("100"));
      let trx2 = await token2.approve(smartSwapPool.address, parseEther("100"));
      await trx1.wait(1);
      await trx2.wait(1);
      // Init LP
      let transactionResponse = await smartSwapPool.init(parseEther("100"), parseEther("100"));
      await transactionResponse.wait(1);

      let expectedTotalLiquidity = parseEther("100"); // sqrt(t1*t2)
      let totalLiquidity = await smartSwapPool.totalLiquidity();
      let deployerLiquidity = await smartSwapPool.liquidity(deployer.address);

      expect(totalLiquidity).to.equal(expectedTotalLiquidity);
      expect(deployerLiquidity).to.equal(expectedTotalLiquidity);
    });
  });

  describe("After init", function() {
    beforeEach(async () => {
      // Approve tokens
      let trx1 = await token1.approve(smartSwapPool.address, parseEther("100"));
      let trx2 = await token2.approve(smartSwapPool.address, parseEther("100"));
      await trx1.wait(1);
      await trx2.wait(1);
      // Init LP
      let transactionResponse = await smartSwapPool.init(parseEther("100"), parseEther("100"));
      await transactionResponse.wait(1);

      deployerT1Amount = await token1.balanceOf(deployer.address);
      deployerT2Amount = await token2.balanceOf(deployer.address);
    });

    describe("Get token reserves", function() {
      it("Should get the correct reserves", async function () {
        let [token1Reserve, token2Reserve] = await smartSwapPool.getTokenReserves();
        expect(token1Reserve).to.equal(parseEther("100"));
        expect(token2Reserve).to.equal(parseEther("100"));
      });
    });

    describe("Get price", function() {
      it("Should revert if input amount is 0", async function () {
        await expect(smartSwapPool.price(true, 0)).to.be.revertedWith(
          "SmartSwapPool__InvalidInputAmount"
        );
      });
      it("Should get the correct price", async function () {
        let outputAmount = await smartSwapPool.price(true, parseEther("10"));
        expect(outputAmount).to.equal(parseEther("9.066108938801491315"));
      });
    });

    describe("Swap", function() {
      it("Updates user balances", async function () {
        let trx = await token1.approve(smartSwapPool.address, parseEther("10"));
        await trx.wait(1);

        let transactionResponse = await smartSwapPool.swap(true, parseEther("10"));
        await transactionResponse.wait(1);

        let expectedNewToken1Amount = deployerT1Amount.sub(parseEther("10"));
        let expectedNewToken2Amount = deployerT2Amount.add(parseEther("9.066108938801491315"));
        let newToken1Amount = await token1.balanceOf(deployer.address);
        let newToken2Amount = await token2.balanceOf(deployer.address);

        expect(newToken1Amount).to.equal(expectedNewToken1Amount);
        expect(newToken2Amount).to.equal(expectedNewToken2Amount);
      });
      it("Updates LP reserves", async function () {
        let trx = await token1.approve(smartSwapPool.address, parseEther("10"));
        await trx.wait(1);

        let transactionResponse = await smartSwapPool.swap(true, parseEther("10"));
        await transactionResponse.wait(1);

        let expectedToken1Reserve = parseEther("110");
        let expectedToken2Reserve = parseEther("100").sub(parseEther("9.066108938801491315"));
        let [token1Reserve, token2Reserve] = await smartSwapPool.getTokenReserves();

        expect(token1Reserve).to.equal(expectedToken1Reserve);
        expect(token2Reserve).to.equal(expectedToken2Reserve);
      });
      it("Emits Swap event", async function () {
        let trx = await token1.approve(smartSwapPool.address, parseEther("10"));
        await trx.wait(1);
        await expect(smartSwapPool.swap(true, parseEther("10"))).to.emit(
          smartSwapPool,
          "Swap"
        );
      });
    });

    describe("Add liquidity", function() {
      it("Should revert if input amount is 0", async function () {
        await expect(smartSwapPool.addLiquidity(0)).to.be.revertedWith(
          "SmartSwapPool__InvalidInputAmount"
        );
      });
      it("Updates the liquidity and reserves when tokens reserves 1:1", async function () {
        // Get current liquidity and token reserves
        let initialLiquidity: BigNumber = await smartSwapPool.totalLiquidity();
        let initialDeployerLPs: BigNumber = await smartSwapPool.liquidity(deployer.address);
        let [initialToken1Reserves, initialToken2Reserves]: BigNumber[] = await smartSwapPool.getTokenReserves();
        let token1Amount = parseEther("5");
        let token2Amount = token1Amount.mul(initialToken2Reserves.div(initialToken1Reserves));
        // Approve tokens
        let trx = await token1.approve(smartSwapPool.address, token1Amount);
        await trx.wait(1);
        let trx2 = await token2.approve(smartSwapPool.address, token2Amount);
        await trx2.wait(1);

        let transactionResponse = await smartSwapPool.addLiquidity(token1Amount);
        await transactionResponse.wait(1);

        let expectedLiquidityAdded = token1Amount.mul(initialLiquidity.div(initialToken1Reserves));
        let expectedNewLiquidity = initialLiquidity.add(expectedLiquidityAdded);
        let expectedNewDeployerLPs = initialDeployerLPs.add(expectedLiquidityAdded);
        let expectedNewToken1Reserve = initialToken1Reserves.add(token1Amount);
        let expectedNewToken2Reserve = initialToken2Reserves.add(token2Amount);
        let newLiquidity = await smartSwapPool.totalLiquidity();
        let newDeployerLPs = await smartSwapPool.liquidity(deployer.address);
        let [newToken1Reserve, newToken2Reserve] = await smartSwapPool.getTokenReserves();

        expect(newLiquidity).to.equal(expectedNewLiquidity);
        expect(newDeployerLPs).to.equal(expectedNewDeployerLPs);
        expect(newToken1Reserve).to.equal(expectedNewToken1Reserve);
        expect(newToken2Reserve).to.equal(expectedNewToken2Reserve);
      });
      it("Updates the liquidity and reserves after a swap", async function () {
        // Swap
        let tr = await token1.approve(smartSwapPool.address, parseEther("10"));
        await tr.wait(1);
        let response = await smartSwapPool.swap(true, parseEther("10"));
        await response.wait(1);

        // Get current liquidity and token reserves
        let initialLiquidity: BigNumber = await smartSwapPool.totalLiquidity();
        let initialDeployerLPs: BigNumber = await smartSwapPool.liquidity(deployer.address);
        let [initialToken1Reserves, initialToken2Reserves]: BigNumber[] = await smartSwapPool.getTokenReserves();
        let token1Amount = parseEther("5");
        let token2Amount = token1Amount.mul(initialToken2Reserves).div(initialToken1Reserves);
        // Approve tokens
        let trx = await token1.approve(smartSwapPool.address, token1Amount);
        await trx.wait(1);
        let trx2 = await token2.approve(smartSwapPool.address, token2Amount);
        await trx2.wait(1);

        let transactionResponse = await smartSwapPool.addLiquidity(token1Amount);
        await transactionResponse.wait(1);

        let expectedLiquidityAdded = token1Amount.mul(initialLiquidity).div(initialToken1Reserves);
        let expectedNewLiquidity = initialLiquidity.add(expectedLiquidityAdded);
        let expectedNewDeployerLPs = initialDeployerLPs.add(expectedLiquidityAdded);
        let expectedNewToken1Reserve = initialToken1Reserves.add(token1Amount);
        let expectedNewToken2Reserve = initialToken2Reserves.add(token2Amount);
        let newLiquidity = await smartSwapPool.totalLiquidity();
        let newDeployerLPs = await smartSwapPool.liquidity(deployer.address);
        let [newToken1Reserve, newToken2Reserve] = await smartSwapPool.getTokenReserves();

        expect(newLiquidity).to.equal(expectedNewLiquidity);
        expect(newDeployerLPs).to.equal(expectedNewDeployerLPs);
        expect(newToken1Reserve).to.equal(expectedNewToken1Reserve);
        expect(newToken2Reserve).to.equal(expectedNewToken2Reserve);
      });
      it("Emits LiquidityAdded event", async function () {
        let trx = await token1.approve(smartSwapPool.address, parseEther("5"));
        await trx.wait(1);
        let trx2 = await token2.approve(smartSwapPool.address, parseEther("5"));
        await trx2.wait(1);
        await expect(smartSwapPool.addLiquidity(parseEther("5"))).to.emit(
          smartSwapPool,
          "LiquidityAdded"
        );
      });
    });

    describe("Remove liquidity", function() {
      it("Updates liquidity", async function () {
        let initialLiquidity: BigNumber = await smartSwapPool.totalLiquidity();
        let initialDeployerLPs: BigNumber = await smartSwapPool.liquidity(deployer.address);
        let lps = parseEther("5");

        let transactionResponse = await smartSwapPool.removeLiquidity(lps);
        await transactionResponse.wait(1);

        let newLiquidity: BigNumber = await smartSwapPool.totalLiquidity();
        let newDeployerLPs: BigNumber = await smartSwapPool.liquidity(deployer.address);

        expect(newLiquidity).to.equal(initialLiquidity.sub(lps));
        expect(newDeployerLPs).to.equal(initialDeployerLPs.sub(lps));
      });
      it("Updates withdraw tokens properly", async function () {
        let initialToken1Amount: BigNumber = await token1.balanceOf(deployer.address);
        let initialToken2Amount: BigNumber = await token2.balanceOf(deployer.address);
        let lps = parseEther("5");

        let transactionResponse = await smartSwapPool.removeLiquidity(lps);
        await transactionResponse.wait(1);

        let newToken1Amount: BigNumber = await token1.balanceOf(deployer.address);
        let newToken2Amount: BigNumber = await token2.balanceOf(deployer.address);
        
        expect(newToken1Amount).to.equal(initialToken1Amount.add(lps));
        expect(newToken2Amount).to.equal(initialToken2Amount.add(lps));
      });
      it("Emits LiquidityRemoved event", async function () {
        await expect(smartSwapPool.removeLiquidity(parseEther("5"))).to.emit(
          smartSwapPool,
          "LiquidityRemoved"
        );
      });
    });
  })
});
