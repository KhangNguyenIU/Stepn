require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-waffle");
// require("hardhat-gas-reporter");


module.exports = {
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
