const { expect } = require('chai');
const { ethers } = require('hardhat')
const {settings} = require('./settings')

describe('Gem', () => {
    let gemInstance, randomInstance;
    let owner, user1, user2, user3
    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners()
        const Random = await ethers.getContractFactory('RandomGenerator');
        randomInstance = await Random.deploy();
        await randomInstance.deployed();

        const Gem = await ethers.getContractFactory('GemNFT');
        gemInstance = await Gem.deploy(randomInstance.address);
        await gemInstance.deployed();
    })

    it("Mint new Gem", async () => {
        let gemTx = await (await gemInstance.mint(user1.address, settings.gem.newGem.id)).wait();
        let gemEvent = gemTx.events.filter(e => e.event == 'Mint')[0].args;

        const gemOwner = await gemInstance.ownerOf(1);
        expect(gemOwner).to.equal(user1.address);
        expect(gemEvent._owner).to.equal(user1.address);
        expect(gemEvent._id.toString()).to.equal(settings.gem.newGem.id);
        expect(gemEvent.gem.attribute).to.be.oneOf(settings.gem.newGem.attribute);
        expect(gemEvent.gem.baseAttribute).to.equal(settings.gem.newGem.baseAttribute);
        expect(gemEvent.gem.effectAttribute).to.equal(settings.gem.newGem.effectAttribute);
    })
})