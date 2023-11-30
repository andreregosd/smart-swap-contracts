// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

error SmartSwapPool__TokenTransferFailed();
error SmartSwapPool__AlreadyHasLiquidity();
error SmartSwapPool__NotEnoughLiquidity();
error SmartSwapPool__InvalidInputAmount();

contract SmartSwapPool {
    address public token0;
    address public token1;
    mapping(address => uint256) public liquidity;
    uint256 public totalLiquidity;
    
    event Swap(address indexed swapper, address indexed fromToken, address indexed toToken, uint256 inputAmount, uint256 outputAmount);
    event LiquidityAdded(address liquidityProvider, uint256 liquidityAdded, uint256 token0Amount, uint256 token1Amount);
    event LiquidityRemoved(address liquidityProvider, uint256 liquidityRemoved, uint256 token0Amount, uint256 token1Amount);

    constructor(address _token0, address _token1) {
        token0 = _token0;
        token1 = _token1;
    }

    function init(uint256 token0Amount, uint256 token1Amount) public returns(uint256) {
        if(totalLiquidity > 0)
            revert SmartSwapPool__AlreadyHasLiquidity();

        if(!IERC20(token0).transferFrom(msg.sender, address(this), token0Amount) ||
            !IERC20(token1).transferFrom(msg.sender, address(this), token1Amount))
            revert SmartSwapPool__TokenTransferFailed();

        totalLiquidity = Math.sqrt(token0Amount * token1Amount);
        liquidity[msg.sender] = totalLiquidity;

        return totalLiquidity;
    }

    function getTokenReserves() public view returns(uint256, uint256) {
        return (IERC20(token0).balanceOf(address(this)), IERC20(token1).balanceOf(address(this)));
    }
    
    function price(bool token0ToToken1, uint256 inputAmount) public view returns(uint256) {
        if(inputAmount <= 0)
            revert SmartSwapPool__InvalidInputAmount();

        (uint256 token0Reserves, uint256 token1Reserves) = getTokenReserves();
        uint256[2] memory tokenReserves = token0ToToken1 ? [token0Reserves, token1Reserves] : [token1Reserves, token0Reserves];
        // t0Reservers * t1Reserves = k and a 0.3% tax
        uint256 outputAmount = (tokenReserves[1] * inputAmount * 997) / (tokenReserves[0] * 1000 + inputAmount * 997);
        return outputAmount;
    }

    function addLiquidity(uint256 token0Amount) public {
        if(token0Amount <= 0)
            revert SmartSwapPool__InvalidInputAmount();

        (uint256 token0Reserves, uint256 token1Reserves) = getTokenReserves();
        uint256 token1Amount = token0Amount * token1Reserves / token0Reserves;
        uint256 liquidityAdded = token0Amount * totalLiquidity / token0Reserves;
        liquidity[msg.sender] += liquidityAdded;
        totalLiquidity += liquidityAdded;

        if(!IERC20(token0).transferFrom(msg.sender, address(this), token0Amount) ||
            !IERC20(token1).transferFrom(msg.sender, address(this), token1Amount))
            revert SmartSwapPool__TokenTransferFailed();

        emit LiquidityAdded(msg.sender, liquidityAdded, token0Amount, token1Amount);
    }

    function removeLiquidity(uint256 lps) public {
        if(liquidity[msg.sender] < lps)
            revert SmartSwapPool__NotEnoughLiquidity();

        (uint256 token0Reserves, uint256 token1Reserves) = getTokenReserves();
        uint256 token0Amount = lps * token0Reserves / totalLiquidity;
        uint256 token1Amount = lps * token1Reserves / totalLiquidity;
        liquidity[msg.sender] -= lps;
        totalLiquidity -= lps;

        if(!IERC20(token0).transfer(msg.sender, token0Amount))
            revert SmartSwapPool__TokenTransferFailed();
        
        if(!IERC20(token1).transfer(msg.sender, token1Amount))
            revert SmartSwapPool__TokenTransferFailed();
            
        emit LiquidityRemoved(msg.sender, lps, token0Amount, token1Amount);
    }

    // receives a bool instead a token address to avoid comparing with storage
    function swap(bool token0ToToken1, uint256 inputAmount) public {
        address[2] memory tokens = token0ToToken1 ? [token0, token1] : [token1, token0];
        uint256 outputAmount = price(token0ToToken1, inputAmount);
        
        if(!IERC20(tokens[0]).transferFrom(msg.sender, address(this), inputAmount))
            revert SmartSwapPool__TokenTransferFailed();

        if(!IERC20(tokens[1]).transfer(msg.sender, outputAmount))
            revert SmartSwapPool__TokenTransferFailed();

        emit Swap(msg.sender, tokens[0], tokens[1], inputAmount, outputAmount);
    }
}

