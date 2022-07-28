
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { BigNumber } = require('bignumber.js')
const { Bignumber2String } = require('../utils/index')

describe("Sneaker NFT", function () {
    let sneakerInstance, GSTTokenInstance, GMTTokenInstance, randomInstance,
        gemInstance, authorityInstance, mysteryBoxInstance, shoeBoxInstance;

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

        gemInstance = await ethers.getContractFactory("GemNFT")
        gemInstance = await gemInstance.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address)

        mysteryBoxInstance = await ethers.getContractFactory("MysteryBox")
        mysteryBoxInstance = await mysteryBoxInstance.deploy(randomInstance.address, gemInstance.address)
        await mysteryBoxInstance.deployed()


        gemInstance.setApproveMint(mysteryBoxInstance.address, true)
        sneakerInstance = await ethers.getContractFactory("SneakerNFT")
        sneakerInstance = await sneakerInstance.deploy(randomInstance.address)
        await sneakerInstance.deployed()

        await sneakerInstance.initialize( GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, mysteryBoxInstance.address)

        mintSneakerTx = await (await sneakerInstance.mint(user1.address, settings.newSneaker.one.quality, settings.newSneaker.one.type,[0,0])).wait()

    })

    it("Mint revert if not owner of SneakerNFT contract", async function () {
        await expect(sneakerInstance.connect(user1).mint(user1.address, 1, 2,[0,0])).to.be.revertedWith("Unauthorized")
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

        expect(newSneaker.sneaker.attributes.efficiency / settings.newSneaker.one.decimal).to.be.at.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.luck / settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.resilience / settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

        expect(newSneaker.sneaker.attributes.comfort / settings.newSneaker.one.decimal).to.be.within(settings.newSneaker.one.attributes.min, settings.newSneaker.one.attributes.max)

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
        it("Transfer sneaker: it should revert if the owner of the sneaker not approve", async () => {
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
    describe("Equip Gem", function () {
        beforeEach(async () => {
            await gemInstance.connect(owner).mint(user1.address, 1)
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user1.address, 3)
            await gemInstance.connect(owner).mint(user1.address, 4)
        })

        it("should revert if the sender is not own the gem", async () => {
            await expect(sneakerInstance.connect(user2).equipGem(settings.newSneaker.one.id, 1, 0)).to.be.revertedWith("SneakerNFT: Only Owner of this Sneaker can perform this action")
        })

        it("should revert if the owner not approve token for equip", async function () {

            await GSTTokenInstance.connect(owner).mintTo(user1.address, String(4 * Number(settings.gem.leveling.price)))
            await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, String(4 * Number(settings.gem.leveling.price)))

            // leveling from 1 to 5
            Promise.all(Array(4).fill(0).map(async () => {
                await (await sneakerInstance.connect(user1).levelingSneaker(settings.newSneaker.one.id)).wait();
            }))

            await expect(sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 1, 0)).to.be.revertedWith("BEP20: transfer amount exceeds balance")
        })
        it("should revert if the socket slot is not unlock yet", async function () {

            // mint token for user 1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.gem.equip.price)
            // user 1 approve to spend token
            await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.equip.price)
            // user 1 equip gem to socket slot 1
            await expect(sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 1, 0)).to.be.revertedWith("SneakerNFT: Sneaker must be level 5 to use socket 1")
        })

        it("Equip gem success", async () => {

            const gem = await gemInstance.getGem(1)
            const gem2 = await gemInstance.getGem(2)
            const gem3 = await gemInstance.getGem(3)
            const gem4 = await gemInstance.getGem(4)

            //mint token for user 1 to level up sneaker from lv1 to lv30
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.gem.leveling.priceToLv30)
            await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.leveling.priceToLv30)

            //level up from lv1 to lv 30
            Promise.all(Array(29).fill(0).map(async () => {
                await (await sneakerInstance.connect(user1).levelingSneaker(settings.newSneaker.one.id)).wait()
            }))

            // mint token for user1 to equip gem
            await GSTTokenInstance.mintTo(user1.address, String(4 * Number(settings.gem.equip.price)))

            // sneaker attribute before equip gem 1 
            let sneakerBefore = await sneakerInstance.getSneaker(settings.newSneaker.one.id)
            // user 1 approve to spend token for equip gem 1
            await (await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.equip.price)).wait()

            await sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 1, 0)
            // expected atribute after equip gem 1
            let resilience = BigNumber(sneakerBefore.attributes.resilience.toString())
            resilience = resilience.times(106).div(100)
            let efficiency = BigNumber(sneakerBefore.attributes.efficiency.toString())
            efficiency = efficiency.times(106).div(100)
            let comfort = BigNumber(sneakerBefore.attributes.comfort.toString())
            comfort = comfort.times(106).div(100)
            let luck = BigNumber(sneakerBefore.attributes.luck.toString())
            luck = luck.times(106).div(100)

            if (gem.attribute == 0) {
                efficiency = efficiency.plus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 1) {
                luck = luck.plus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 2) {
                comfort = comfort.plus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 3) {
                resilience = resilience.plus(gem.baseAttribute * settings.decimal)
            }


            // sneaker attribute after equip gem 1 at slot 0
            let sneakerAfter = await sneakerInstance.getSneaker(settings.newSneaker.one.id)
            // console.log({ sneakerAfter: sneakerAfter.attributes })
            expect(sneakerAfter.attributes.resilience.toString()).to.be.equal(resilience.toString())
            expect(sneakerAfter.attributes.efficiency.toString()).to.be.equal(efficiency.toString())
            expect(sneakerAfter.attributes.comfort.toString()).to.be.equal(comfort.toString())
            expect(sneakerAfter.attributes.luck.toString()).to.be.equal(luck.toString())


            // user 1 approve to spend token for equip gem 2
            await (await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.equip.price)).wait()

            // equip gem2 instead of gem1
            await sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 2, 0)

            // remove extra attribute gain from gem1
            if (gem.attribute == 0) {
                efficiency = efficiency.minus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 1) {
                luck = luck.minus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 2) {
                comfort = comfort.minus(gem.baseAttribute * settings.decimal)
            }
            if (gem.attribute == 3) {
                resilience = resilience.minus(gem.baseAttribute * settings.decimal)
            }
            resilience = resilience.times(100).div(100 + gem.effectAttribute)
            efficiency = efficiency.times(100).div(100 + gem.effectAttribute)
            comfort = comfort.times(100).div(100 + gem.effectAttribute)
            luck = luck.times(100).div(100 + gem.effectAttribute)



            // add extra attribute gain from gem2 at slot 1
            resilience = resilience.times(100 + gem2.effectAttribute).div(100)
            efficiency = efficiency.times(100 + gem2.effectAttribute).div(100)
            comfort = comfort.times(100 + gem2.effectAttribute).div(100)
            luck = luck.times(100 + gem2.effectAttribute).div(100)

            if (gem2.attribute == 0) {
                efficiency = efficiency.plus(gem2.baseAttribute * settings.decimal)
            }
            if (gem2.attribute == 1) {
                luck = luck.plus(gem2.baseAttribute * settings.decimal)
            }
            if (gem2.attribute == 2) {
                comfort = comfort.plus(gem2.baseAttribute * settings.decimal)
            }
            if (gem2.attribute == 3) {
                resilience = resilience.plus(gem2.baseAttribute * settings.decimal)
            }

            // sneaker attribute after equip gem 2
            let sneakerAfter2 = await sneakerInstance.getSneaker(settings.newSneaker.one.id)

            expect(sneakerAfter2.attributes.resilience.toString()).to.be.equal(resilience.toString())
            expect(sneakerAfter2.attributes.efficiency.toString()).to.be.equal(efficiency.toString())
            expect(sneakerAfter2.attributes.comfort.toString()).to.be.equal(comfort.toString())
            expect(sneakerAfter2.attributes.luck.toString()).to.be.equal(luck.toString())


            // user 1 approve to spend token for equip gem 3
            await (await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.equip.price)).wait()
            // equip gem3 at slot 1
            await sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 3, 1)


            let sneakerAfter3 = await sneakerInstance.getSneaker(settings.newSneaker.one.id)

            resilience = resilience.times(100 + gem3.effectAttribute).div(100)
            efficiency = efficiency.times(100 + gem3.effectAttribute).div(100)
            comfort = comfort.times(100 + gem3.effectAttribute).div(100)
            luck = luck.times(100 + gem3.effectAttribute).div(100)

            if (gem3.attribute == 0) {
                efficiency = efficiency.plus(gem3.baseAttribute * settings.decimal)
            }
            if (gem3.attribute == 1) {
                luck = luck.plus(gem3.baseAttribute * settings.decimal)
            }
            if (gem3.attribute == 2) {
                comfort = comfort.plus(gem3.baseAttribute * settings.decimal)
            }
            if (gem3.attribute == 3) {
                resilience = resilience.plus(gem3.baseAttribute * settings.decimal)
            }

            expect(sneakerAfter3.attributes.resilience.toString()).to.be.equal(resilience.toString())
            expect(sneakerAfter3.attributes.efficiency.toString()).to.be.equal(efficiency.toString())
            expect(sneakerAfter3.attributes.comfort.toString()).to.be.equal(comfort.toString())
            expect(sneakerAfter3.attributes.luck.toString()).to.be.equal(luck.toString())


            // user 1 approve to spend token for equip gem 4
            await (await GSTTokenInstance.connect(user1).approve(sneakerInstance.address, settings.gem.equip.price)).wait()
            // equip gem4 at slot 2
            await sneakerInstance.connect(user1).equipGem(settings.newSneaker.one.id, 4, 2)

            let sneakerAfter4 = await sneakerInstance.getSneaker(settings.newSneaker.one.id)

            resilience = resilience.times(100 + gem4.effectAttribute).div(100)
            efficiency = efficiency.times(100 + gem4.effectAttribute).div(100)
            comfort = comfort.times(100 + gem4.effectAttribute).div(100)
            luck = luck.times(100 + gem4.effectAttribute).div(100)

            if (gem4.attribute == 0) {
                efficiency = efficiency.plus(gem4.baseAttribute * settings.decimal)
            }
            if (gem4.attribute == 1) {
                luck = luck.plus(gem4.baseAttribute * settings.decimal)
            }
            if (gem4.attribute == 2) {
                comfort = comfort.plus(gem4.baseAttribute * settings.decimal)
            }
            if (gem4.attribute == 3) {
                resilience = resilience.plus(gem4.baseAttribute * settings.decimal)
            }

            expect(sneakerAfter4.attributes.resilience.toString()).to.be.equal(resilience.toString())
            expect(sneakerAfter4.attributes.efficiency.toString()).to.be.equal(efficiency.toString())
            expect(sneakerAfter4.attributes.comfort.toString()).to.be.equal(comfort.toString())
            expect(sneakerAfter4.attributes.luck.toString()).to.be.equal(luck.toString())
        })
    })
})  