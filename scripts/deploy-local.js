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

    console.log({address})
    let shoeBoxInstance, gemInstance, move2EarnInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance, mintingScrollInstance, mysteryBoxInstance, marketplaceInstance;

    const [deployer, account1, account2] = await ethers.getSigners();
    const deployerLog = { Label: 'Deployer', Info: deployer.address };
    const developerBalanceLog = { Label: 'Deployer Balance', Info: await ((await deployer.getBalance()).toString()) };

    console.table({ deployer: deployer.address, account1: account1.address, account2: account2.address });
    // Contract Instances
    GSTTokenInstance = await ethers.getContractFactory('GSTToken')
    GMTTokenInstance = await ethers.getContractFactory('GMTToken')
    randomInstance = await ethers.getContractFactory('RandomGenerator')
    gemInstance = await ethers.getContractFactory('GemNFT')
    sneakerInstance = await ethers.getContractFactory('SneakerNFT')
    mintingScrollInstance = await ethers.getContractFactory('MintingScrollNFT')
    mysteryBoxInstance = await ethers.getContractFactory('MysteryBox')
    shoeBoxInstance = await ethers.getContractFactory('ShoeBoxNFT')
    marketplaceInstance = await ethers.getContractFactory('Marketplace')
    move2EarnInstance = await ethers.getContractFactory('Move2Earn')

    // Deploy contract
    GSTTokenInstance = await GSTTokenInstance.deploy()

    GMTTokenInstance = await GMTTokenInstance.deploy()

    randomInstance = await randomInstance.deploy()

    gemInstance = await gemInstance.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address)

    sneakerInstance = await sneakerInstance.deploy(randomInstance.address)

    mintingScrollInstance = await mintingScrollInstance.deploy(randomInstance.address)

    shoeBoxInstance = await shoeBoxInstance.deploy(randomInstance.address, sneakerInstance.address, mintingScrollInstance.address)

    mysteryBoxInstance = await mysteryBoxInstance.deploy(randomInstance.address, gemInstance.address)

    marketplaceInstance = await marketplaceInstance.deploy(settings.marketplace.feeRate, settings.marketplace.feeDecimal, GSTTokenInstance.address)

    move2EarnInstance = await move2EarnInstance.deploy(sneakerInstance.address)

    await sneakerInstance.connect(deployer).initialize(GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, shoeBoxInstance.address, move2EarnInstance.address)

    await gemInstance.setApproveMint(mysteryBoxInstance.address, true)

    // Initial Mint 
    await GSTTokenInstance.connect(deployer).mintTo(account1.address, settings.initialMint.balance)

   

    // Log contract addresses
    const GSTLog = { Label: 'GST TOKEN address', Info: GSTTokenInstance.address }
    const GMTLog = { Label: 'GMT TOKEN address', Info: GMTTokenInstance.address }
    const randomLog = { Label: 'Random Generator address', Info: randomInstance.address }
    const gemLog = { Label: 'Gem NFT address', Info: gemInstance.address }
    const sneakerLog = { Label: 'Sneaker NFT address', Info: sneakerInstance.address }
    const mintingScrollLog = { Label: 'Minting Scroll NFT address', Info: mintingScrollInstance.address }
    const shoeBoxLog = { Label: 'Shoe Box NFT address', Info: shoeBoxInstance.address }
    const mysteryBoxLog = { Label: 'Mystery Box NFT address', Info: mysteryBoxInstance.address }
    const marketplaceLog = { Label: 'Marketplace address', Info: marketplaceInstance.address }
    const move2EarnLog = { Label: 'Move2Earn address', Info: move2EarnInstance.address }

    console.table([
        deployerLog,
        developerBalanceLog,
        GSTLog,
        GMTLog,
        randomLog,
        gemLog,
        sneakerLog,
        mintingScrollLog,
        shoeBoxLog,
        mysteryBoxLog,
        marketplaceLog,
        move2EarnLog
    ])

    const contractAddressFE = {
        GSTToken: GSTTokenInstance.address,
        GMTToken: GMTTokenInstance.address,
        gemNFT: gemInstance.address,
        sneakerNFT: sneakerInstance.address,
        mintingScrollNFT: mintingScrollInstance.address,
        shoeBoxNFT: shoeBoxInstance.address,
        mysteryBoxNFT: mysteryBoxInstance.address,
        marketplace: marketplaceInstance.address,
        move2Earn: move2EarnInstance.address

    }
    const contractAddressBE = {
        GSTToken: GSTTokenInstance.address,
        GMTToken: GMTTokenInstance.address,
        randomGenerator: randomInstance.address,
        gemNFT: gemInstance.address,
        sneakerNFT: sneakerInstance.address,
        mintingScrollNFT: mintingScrollInstance.address,
        shoeBoxNFT: shoeBoxInstance.address,
        mysteryBoxNFT: mysteryBoxInstance.address,
        marketplace: marketplaceInstance.address,
        move2Earn: move2EarnInstance.address
    }
    writeAbiFile(contractAbiDirs);
    writeAdressFile(JSON.stringify(contractAddressFE), FE_ADDRESS_DIR_PATH);
    writeAdressFile(JSON.stringify(contractAddressBE), BE_ADDRESS_DIR_PATH);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });