import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import '@typechain/hardhat/dist/type-extensions';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import 'hardhat-deploy';
import 'solidity-coverage';
import { HardhatUserConfig, MultiSolcUserConfig, NetworksUserConfig } from 'hardhat/types';
import * as env from './utils/env';
import 'tsconfig-paths/register';

const networks: NetworksUserConfig =
  env.isHardhatCompile() || env.isHardhatClean() || env.isTesting()
    ? {}
    : {
        hardhat: {
          forking: {
            enabled: process.env.FORK ? true : false,
            url: env.getNodeUrl('ethereum'),
          },
        },
        fantom: {
          url: env.getNodeUrl('fantom'),
          accounts: env.getAccounts('fantom'),
        },
        polygon: {
          url: env.getNodeUrl('polygon'),
          accounts: env.getAccounts('polygon'),
        },
        ethereum: {
          chainId: 1,
          url: env.getNodeUrl('ethereum'),
          accounts: env.getAccounts('ethereum'),
        },
      };

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: 0, // yMECH Alice
    governor: {
      default: 0, // yMECH Alice
      1: '0xfeb4acf3df3cdea7399794d0869ef76a6efaff52', // ychad
      250: '0x9f2A061d6fEF20ad3A656e23fd9C814b75fd5803', // ymechs msig
    },
    yMech: '0xB82193725471dC7bfaAB1a3AB93c7b42963F3265', // yMECH b0dhi
  },
  mocha: {
    timeout: process.env.MOCHA_TIMEOUT || 300000,
  },
  networks,
  solidity: {
    compilers: [
      {
        version: '0.8.9',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: process.env.COINMARKETCAP_DEFAULT_CURRENCY || 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: process.env.REPORT_GAS ? true : false,
    showMethodSig: true,
    onlyCalledMethods: false,
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat'),
  },
  etherscan: {
    apiKey: env.getEtherscanAPIKeys(['ethereum']),
  },
  typechain: {
    outDir: 'typechained',
    target: 'ethers-v5',
  },
  paths: {
    sources: './solidity',
  },
};

if (process.env.TEST) {
  (config.solidity as MultiSolcUserConfig).compilers = (config.solidity as MultiSolcUserConfig).compilers.map((compiler) => {
    return {
      ...compiler,
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    };
  });
}

export default config;
