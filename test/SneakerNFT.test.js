
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('./settings')
const { BigNumber } = require('bignumber.js')
const { Bignumber2String } = require('../utils/index')

describe("Sneaker NFT", function () {
    let sneakerInstance, GSTTokenInstance, GMTTokenInstance, randomInstance, authorityInstance;

    let owner, user1, user2, user3;
    let mintSneakerTx;
    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners();

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
        await expect(sneakerInstance.connect(user1).mint(user1.address, 1, 1)).to.be.revertedWith("Unauthorized")
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

        expect(newSneaker.sneaker.attributes.efficiency/10**settings.newSneaker.one.decimal).to.be.at.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.luck/10**settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.resilience/10**settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.comfort/10**settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

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

    describe("Sneaker decay", function () {
        it("sneaker decay: it should revert if the sender is not in authority list", async function () {
            await expect(sneakerInstance.connect(user1).decaySneaker(settings.newSneaker.one.id, settings.update.decay.durability, settings.update.decay.hp)).to.be.revertedWith("Unauthorized")
        })

        it("sneaker decay: it should revert if durability decay or hp decay exceed value ", async function () {
            await expect(sneakerInstance.connect(owner).decaySneaker(settings.newSneaker.one.id, settings.update.decay.exceedDurability, settings.update.decay.hp)).to.be.revertedWith("SneakerNFT: Durability is too low")

            await expect(sneakerInstance.connect(owner).decaySneaker(settings.newSneaker.one.id, settings.update.decay.durability, settings.update.decay.exceedHP)).to.be.revertedWith("SneakerNFT: HP is too low")
        })

        it("should decay sneaker successful", async function () {
            let sneakerBefore = await sneakerInstance.getSneaker(settings.newSneaker.one.id)
            await (await sneakerInstance.connect(owner).decaySneaker(settings.newSneaker.one.id, settings.update.decay.durability, settings.update.decay.hp)).wait()
            let sneakerAfter = await sneakerInstance.getSneaker(settings.newSneaker.one.id)

            expect(sneakerAfter.durability.toString()).to.be.equal(String(Number(sneakerBefore.durability) - settings.update.decay.durability))
            expect(sneakerAfter.hp.toString()).to.be.equal(String(Number(sneakerBefore.hp) - settings.update.decay.hp))
        })

    })

    describe("Sneaker repair", function () {
        beforeEach(async () => {
            await (await sneakerInstance.connect(owner).decaySneaker(settings.newSneaker.one.id, settings.update.decay.durability, settings.update.decay.hp)).wait()
        })

        it("sneaker repair: it should revert if the sender is not in authority list", async function () {
            await expect(sneakerInstance.connect(user2).repairSneaker(settings.newSneaker.one.id)).to.be.revertedWith("SneakerNFT: Only Owner of this Sneaker can perform this action")
        })

        it("sneaker repair revert if not enough balance", async () => {
            await expect(sneakerInstance.connect(user1).repairSneaker(settings.newSneaker.one.id)).to.be.revertedWith("BEP20: transfer amount exceeds balance")
        })

        it("It should repair successful", async () => {
            await GSTTokenInstance.mintTo(user1.address, settings.update.decay.repairPrice)
            await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.update.decay.repairPrice)

            await (await sneakerInstance.connect(user1).repairSneaker(settings.newSneaker.one.id)).wait()

            let sneakerAfterRepair = await sneakerInstance.getSneaker(settings.newSneaker.one.id)

            // expect durability & hp to be 100
            expect(sneakerAfterRepair.durability.toString()).to.be.equal(String(Number(settings.newSneaker.one.durability)))
            expect(sneakerAfterRepair.hp.toString()).to.be.equal(String(Number(settings.newSneaker.one.hp)))
        })
    })

    describe("Transfer sneaker", function () {
        it("Transfer sneaker: it should revert if the owner of the sneaker not approve", async ()=>{
            await expect(sneakerInstance.connect(owner).transferSneaker(user1.address, user3.address, settings.newSneaker.one.id)).to.be.revertedWith("ERC721: caller is not token owner nor approved")
        })

        it("It should transfer sneaker successfull", async () => {
            // user approve sneaker contract to transfer nft
            await (await sneakerInstance.connect(user1).setApprovalForAll(owner.address, true))

            await (await sneakerInstance.connect(owner).transferSneaker(user1.address, user3.address, 0)).wait()

            let sneakerAfterTransfer = await sneakerInstance.getSneaker(settings.newSneaker.one.id)
            expect(sneakerAfterTransfer.owner).to.be.equal(user3.address)

        })
    })
    describe("Equip Gem", function(){

        it(" Equip Gem: revert if the sender is not the owner of the gem", async () => {
            let sneaker = await sneakerInstance.getSneaker(1)
            // console.log(sneaker)

        })
    })
})  