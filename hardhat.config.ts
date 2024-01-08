import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'solidity-coverage';
import "@nomiclabs/hardhat-etherscan";
require('dotenv').config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
          version: "0.8.19",
      },
      {
          version: "0.8.20",
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/" + ALCHEMY_API_KEY,
      }
    }
  }
};

export default config;
