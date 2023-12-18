import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'solidity-coverage';
import * as dotenv from "dotenv";
import "@nomiclabs/hardhat-etherscan";

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
  }
};

export default config;
