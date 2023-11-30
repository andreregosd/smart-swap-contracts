// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import './SmartSwapPool.sol';

error SmartSwapFactory__NeedTwoDifferentTokens();
error SmartSwapFactory__ZeroTokenError();
error SmartSwapFactory__PoolAlreadyExists();

contract SmartSwapFactory {
    mapping(address => mapping(address => address)) public liquidityPools;
    address[] public allLiquidityPools;

    event PoolCreated(address indexed token0, address indexed token1, address pool);

    constructor(){
    }

    function createPool(address tokenA, address tokenB) external returns (address) {
        if(tokenA == tokenB)
            revert SmartSwapFactory__NeedTwoDifferentTokens();

        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        if(token0 == address(0))
            revert SmartSwapFactory__ZeroTokenError();
        if(liquidityPools[token0][token1] != address(0))
            revert SmartSwapFactory__PoolAlreadyExists();

        SmartSwapPool pool = new SmartSwapPool(token0, token1);
        liquidityPools[token0][token1] = address(pool);
        // populate mapping in the reverse direction to avoid the cost of comparing addresses
        liquidityPools[token1][token0] = address(pool);

        emit PoolCreated(token0, token1, address(pool));

        return address(pool);
    }
}

