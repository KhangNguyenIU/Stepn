require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ganache");
// require("hardhat-gas-reporter");
const secret = require('./secret.json')

module.exports = {
    networks: {
        bsc_testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            // gasPrice: 50000000000,
            // gasPrice: 250000000000,
            gasPrice: 25000000000,

            accounts: { mnemonic: secret.mnemonic },
            blockGasLimit: 13000000000000,
            
        },
        ganache: {
            url: "HTTP://127.0.0.1:7545",
            chainId: 1337,
            gasPrice: 20000000000,
            blockGasLimit: 13000000000000,
        },
        hardhat: {
            chainId: 1337,
            accounts: { mnemonic: secret.mnemonic }
        }
    },
    solidity: {
        version: "0.8.2",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    }
};
