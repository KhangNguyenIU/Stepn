
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('./settings')
const { BigNumber } = require('bignumber.js')
const { Bignumber2String } = require('../utils/index')
describe("Sneaker NFT", function () {
    let sneakerInstance, GSTTokenInstance, GMTTokenInstance, randomInstance;

    let owner, user1, user2;
    let mintSneakerTx;
    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners();

        randomInstance = await ethers.getContractFactory("RandomGenerator")
        randomInstance = await randomInstance.deploy()
        await randomInstance.deployed()

        GSTTokenInstance = await ethers.getContractFactory("GSTToken")
        GSTTokenInstance = await GSTTokenInstance.deploy()

        GMTTokenInstance = await ethers.getContractFactory("GMTToken")
        GMTTokenInstance = await GMTTokenInstance.deploy()

        sneakerInstance = await ethers.getContractFactory("SneakerNFT")
        sneakerInstance = await sneakerInstance.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address)
        await sneakerInstance.deployed()
        mintSneakerTx = await (await sneakerInstance.mint(user1.address, settings.newSneaker.one.quality, settings.newSneaker.one.type)).wait()
    })

    it("Mint revert if not owner of SneakerNFT contract", async function () {
        await expect(sneakerInstance.connect(user1).mint(user1.address, 1, 1)).to.be.revertedWith("'Ownable: caller is not the owner")
    })

    it("Mint should mint a new sneaker with correct attributes", async function () {
        let newSneaker = mintSneakerTx.events.filter(e => e.event == "MintSneaker")[0].args

        expect(Bignumber2String(newSneaker.tokenId)).to.equal(settings.newSneaker.one.id)
        expect(newSneaker.sneaker.durability.toString()).to.equal(settings.newSneaker.one.durability)
        expect(newSneaker.sneaker.hp.toString()).to.equal(settings.newSneaker.one.hp)

        expect(Bignumber2String(newSneaker.sneaker.speed[0])).to.equal(settings.newSneaker.one.speed.min)
        expect(Bignumber2String(newSneaker.sneaker.speed[1])).to.equal(settings.newSneaker.one.speed.max)
        expect(newSneaker.sneaker.level.toString()).to.equal(settings.newSneaker.one.level)
        expect(newSneaker.sneaker.quality.toString()).to.equal(settings.newSneaker.one.quality)
        expect(newSneaker.sneaker.sneakerType.toString()).to.equal(settings.newSneaker.one.type)
        expect(newSneaker.sneaker.mintCount.toString()).to.equal(settings.newSneaker.one.mintCount)
        expect(newSneaker.sneaker.mintFrom.length).to.equal(settings.newSneaker.one.mintFrom)
        expect(newSneaker.sneaker.isEarningGMT).to.equal(settings.newSneaker.one.isEarningGMT)

        expect(newSneaker.sneaker.attributes.efficiency).to.be.at.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.luck).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.resilience).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.comfort).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

    })

    it("should return correct owner of the sneaker", async function () {
        let sneakerOwner = await sneakerInstance.getOwnerOfSneaker(0)
        expect(sneakerOwner).to.equal(user1.address)
    })

    // it("should return attributes of a sneaker", async function(){
    //     let attributes = await sneakerInstance.getAttributesOfSneaker(settings.newSneaker.one.id)
    //     console.log(attributes)
    // })

    it("Burn sneaker should revert if the sender is not the  owner of the sneaker", async function () {
        await expect(sneakerInstance.connect(owner).burnSneaker(settings.newSneaker.one.id)).to.be.revertedWith("Only Owner of this Sneaker can perform this action")
    })


    it("should burn Sneaker successfull", async function () {
        const burnSneakerTx = await (await sneakerInstance.connect(user1).burnSneaker(settings.newSneaker.one.id)).wait()
        const burnSneakerEvent = burnSneakerTx.events.filter(e => e.event == "BurnSneaker")[0].args

        // console.log({burnSneakerEvent})
        expect(burnSneakerEvent.tokenId.toString()).to.equal(settings.newSneaker.one.id)
        expect(burnSneakerEvent._owner).to.be.equal(user1.address)

        // the info of the sneaker should be empty
        await expect(sneakerInstance.getOwnerOfSneaker(settings.newSneaker.one.id)).to.be.revertedWith("ERC721: invalid token ID")
    })

    describe("Upgrade sneaker", function () {
        it("update should revert if the sender is not the owner of the sneaker ", async function () {
            await expect(sneakerInstance.connect(owner).levelingSneaker(settings.newSneaker.one.id)).to.be.revertedWith("Only Owner of this Sneaker can perform this action")
        })

        it("should leveling sneaker successful", async () => {
            // mint GST token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.newSneaker.one.levelingPrice)
            let balanceBefore = await GSTTokenInstance.balanceOf(user1.address)

            // user1 approve token amount to leveling sneaker contract
            await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.newSneaker.one.levelingPrice)
            await (await sneakerInstance.connect(user1).levelingSneaker(settings.newSneaker.one.id)).wait();

            let balanceAfter = await GSTTokenInstance.balanceOf(user1.address)
            let levelAfter = await (await sneakerInstance.getSneaker(settings.newSneaker.one.id)).level

            expect(levelAfter.toString()).to.equal(String(Number(settings.newSneaker.one.level) + 1))
            expect(balanceBefore.toString()).to.be.equal(settings.newSneaker.one.levelingPrice)
            expect(balanceAfter.toString()).to.be.equal('0')
        })
    })
})  