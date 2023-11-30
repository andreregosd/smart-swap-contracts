# SmartSwap
A decentralized exchange for the Ethereum blockchain.

# SmartSwapFactory
SmartSwap follows the factory pattern to provide the ability for users to create new liquidity pools (or pairs).

# SmartSwapPool
A SmartSwapPool is a liquidity pool or a pair of tokens. Each pool offers users the ability to swap tokens with a small fee (0.3%). It also offers the opportunity for users to earn tokens from the swap fees by providing liquidity to the SmartSwapPool.

# UniSwap V2
This project is inspired by UniSwap V2. The ability to create liquidity pools via a Factory contract and the AMM calculations are some of the similarities. Although, there are some differences. The UniSwap pools are ERC20 tokens that mints or burns tokens as the liquidity on the pool is added or removed and the interactions with these pools are made through a Router contract. On the other hand, SmartSwap pools stores the balances like an ERC20 token, but they aren't ERC20 tokens and all the interactions (swap, add liquidity, remove liquidity) are made with direct calls to the SmartPools smart contracts.