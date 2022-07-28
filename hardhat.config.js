require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
// require("hardhat-gas-reporter");
const secret = require('./secret.json')

module.exports = {
    networks:{
        bsc_testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: 20000000000,
            accounts: { mnemonic: secret.mnemonic },
            blockGasLimit: 13000000000000,
        }

    },
  solidity: {
    version:"0.8.2",
    settings :{
        optimizer: {
            enabled : true,
            runs: 200
        }
    }
  }
};
