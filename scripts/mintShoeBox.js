const { ethers } = require('hardhat')
const { settings } = require('../test/settings');
const { writeAbiFile, writeAdressFile } = require('../utils/index')
const address = require('../contractAddress.json')

const contractAbiDirs = [
    { folder: 'GSTToken.sol', file: 'GSTToken.json' },
    { folder: 'GMTToken.sol', file: 'GMTToken.json' },
    { folder: 'GemNFT.sol', file: 'GemNFT.json' },
    { folder: 'SneakerNFT.sol', file: 'SneakerNFT.json' },
    { folder: 'MintingScrollNFT.sol', file: 'MintingScrollNFT.json' },
    { folder: 'ShoeBoxNFT.sol', file: 'ShoeBoxNFT.json' },
    { folder: 'MysteryBox.sol', file: 'MysteryBox.json' },
    { folder: 'Marketplace.sol', file: 'Marketplace.json' },
    { folder: 'Move2Earn.sol', file: 'Move2Earn.json' }
]

const FE_ADDRESS_DIR_PATH = "./client/src/address/contractAddress.json";
const BE_ADDRESS_DIR_PATH = "contractAddress.json"


async function main() {
    let shoeBoxInstance, gemInstance, move2EarnInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance, mintingScrollInstance, mysteryBoxInstance, marketplaceInstance;

    const [deployer, account1, account2] = await ethers.getSigners();
    const deployerLog = { Label: 'Deployer', Info: deployer.address };
    const developerBalanceLog = { Label: 'Deployer Balance', Info: await ((await deployer.getBalance()).toString()) };

    console.table({deployer:deployer.address, account1: account1.address, account2: account2.address });
    // Contract Instances
    GSTTokenInstance = await (await ethers.getContractFactory('GSTToken')).attach(address.GSTToken)
    GMTTokenInstance = await (await ethers.getContractFactory('GMTToken')).attach(address.GMTToken)
    randomInstance = await (await ethers.getContractFactory('RandomGenerator')).attach(address.randomGenerator)
    gemInstance = await (await ethers.getContractFactory('GemNFT')).attach(address.gemNFT)
    sneakerInstance = await (await ethers.getContractFactory('SneakerNFT')).attach(address.sneakerNFT)
    mintingScrollInstance = await (await ethers.getContractFactory('MintingScrollNFT')).attach(address.mintingScrollNFT)
    mysteryBoxInstance = await (await ethers.getContractFactory('MysteryBox')).attach(address.mysteryBoxNFT)
    shoeBoxInstance = await (await ethers.getContractFactory('ShoeBoxNFT')).attach(address.shoeBoxNFT)
    marketplaceInstance = await (await ethers.getContractFactory('Marketplace')).attach(address.marketplace)
    move2EarnInstance = await (await ethers.getContractFactory('Move2Earn')).attach(address.move2Earn)

    await (await shoeBoxInstance.connect(account1).mint(7,8,1,10)).wait()

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });