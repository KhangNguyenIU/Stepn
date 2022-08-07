const { ethers } = require('hardhat')
const { settings } = require('../test/settings');
const address = require('../contractAddress.json')

async function main() {
    console.log("MINT INITIAL SNEAKER..")
    let shoeBoxInstance, gemInstance, move2EarnInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance, mintingScrollInstance, mysteryBoxInstance, marketplaceInstance;

    const [deployer, account1, account2] = await ethers.getSigners();

    console.table({ deployer: deployer.address, account1: account1.address, account2: account2.address });
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


    // Mint sneakers
    await(await sneakerInstance.connect(deployer).mint(account1.address, 0, 1, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(account1.address, 1, 1, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(deployer.address, 2, 1, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(account1.address, 2, 2, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(account1.address, 2, 3, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(account2.address, 3, 3, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(deployer.address, 3, 1, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(account1.address, 4, 1, [0, 0])).wait()
    await(await sneakerInstance.connect(deployer).mint(deployer.address, 4, 2, [0, 0])).wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });