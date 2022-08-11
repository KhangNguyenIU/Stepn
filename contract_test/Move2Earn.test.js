const { expect } = require('chai')
const { ethers } = require('hardhat');
const { settings } = require('../test/settings');
const { Bignumber2String, sleep } = require('../utils/index')


describe("Move2Earn", function () {
    let shoeBoxInstance, gemInstance, move2EarnInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance, mintingScrollInstance, mysteryBoxInstance;
    let owner, user1, user2
    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners()

        const GSTToken = await ethers.getContractFactory('GSTToken')
        GSTTokenInstance = await GSTToken.deploy()
        await GSTTokenInstance.deployed()

        const GMTToken = await ethers.getContractFactory('GMTToken')
        GMTTokenInstance = await GMTToken.deploy()
        await GMTTokenInstance.deployed()

        const Random = await ethers.getContractFactory('RandomGenerator');
        randomInstance = await Random.deploy();
        await randomInstance.deployed();

        const Gem = await ethers.getContractFactory('GemNFT');
        gemInstance = await Gem.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address);
        await gemInstance.deployed();

        const Sneaker = await ethers.getContractFactory('SneakerNFT');
        sneakerInstance = await Sneaker.deploy(randomInstance.address);
        await sneakerInstance.deployed();

        const MysteryBox = await ethers.getContractFactory('MysteryBox');
        mysteryBoxInstance = await MysteryBox.deploy(randomInstance.address, gemInstance.address);
        await mysteryBoxInstance.deployed();

        const MintingScroll = await ethers.getContractFactory('MintingScrollNFT');
        mintingScrollInstance = await MintingScroll.deploy(randomInstance.address);

        const ShoeBox = await ethers.getContractFactory('ShoeBoxNFT')
        shoeBoxInstance = await ShoeBox.deploy(randomInstance.address, sneakerInstance.address, mintingScrollInstance.address);
        await shoeBoxInstance.deployed()

        const Move2Earn = await ethers.getContractFactory('Move2Earn')
        move2EarnInstance = await Move2Earn.deploy(sneakerInstance.address, mysteryBoxInstance.address)
        await move2EarnInstance.deployed()

        await sneakerInstance.connect(owner).initialize(GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, shoeBoxInstance.address, move2EarnInstance.address);

        await sneakerInstance.connect(owner).mint(user1.address, 1, 2, [0, 0]);

    })

    it("should revert if GPS signal is false", async () => {

        const sneaker = await sneakerInstance.connect(user1).getSneaker(0);
        // console.log({sneaker})
        await expect(move2EarnInstance.connect(user1).move2Earn(0, 3, 10, false)).to.be.revertedWith("Move2Earn: GPS signal is required")

        // console.log({address : user1.address})
    })

    it("should revert if the sender is not the owner of the sneaker", async () => {
        await expect(move2EarnInstance.connect(user2).move2Earn(0, 3, 10, true)).to.be.revertedWith("Move2Earn: Only owner can use sneaker")
    })

    it("should revert if the sender is out of energy", async () => {
        await GSTTokenInstance.connect(owner).mintTo(sneakerInstance.address, String(Number(settings.move2Earn.sneakerContractBlance) * 2))
        await move2EarnInstance.connect(user1).move2Earn(0, 3, 10, true)
        await expect(move2EarnInstance.connect(user1).move2Earn(0, 3, 10, true)).to.be.revertedWith("Move2Earn: You don't have enough energy")
    })

    it("should revert if sneaker HP is too low", async () => {

        await sneakerInstance.connect(owner).decaySneaker(0, 0, 90)
        await GSTTokenInstance.connect(owner).mintTo(sneakerInstance.address, String(Number(settings.move2Earn.sneakerContractBlance) * 2))
        await expect(move2EarnInstance.connect(user1).move2Earn(0, 3, 10, true)).to.be.revertedWith("Move2Earn: Sneaker is too damaged")
    })

    it("should revert if sneaker durability is too low", async () => {

        await sneakerInstance.connect(owner).decaySneaker(0, 90, 0)
        await GSTTokenInstance.connect(owner).mintTo(sneakerInstance.address, String(Number(settings.move2Earn.sneakerContractBlance) * 2))
        await expect(move2EarnInstance.connect(user1).move2Earn(0, 3, 10, true)).to.be.revertedWith("Move2Earn: Sneaker is too damaged")
    })

    describe("Move succes", function () {
        beforeEach(async () => {
            await GSTTokenInstance.connect(owner).mintTo(sneakerInstance.address, settings.move2Earn.sneakerContractBlance)
        })
        it("move success: reduce energy", async () => {
            let mysBox = await mysteryBoxInstance.connect(user1).getMysteryBox(1);
            console.log({mysBox})

            let energyBefore = await move2EarnInstance.connect(user1).getUserEnergy(user1.address)
            await move2EarnInstance.connect(user1).move2Earn(0, 3, 10, true);
            let energyAfter = await move2EarnInstance.connect(user1).getUserEnergy(user1.address)

             mysBox = await mysteryBoxInstance.connect(user1).getMysteryBox(1);
            console.log({mysBox})

            expect(energyBefore.energy).to.be.equal(2)
            expect(energyBefore.maxEnergy).to.be.equal(2)

            expect(energyAfter.energy).to.be.equal(0)
            expect(energyAfter.maxEnergy).to.be.equal(2)

        })

        it("move success: decay sneaker after move ", async () => {
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            const sneaker = await sneakerInstance.getSneaker(settings.move2Earn.tokenId)
            let usedEnergy = settings.move2Earn.normalMove.optimalDuration / 5

            expect(sneaker.durability).to.be.equal(100 - usedEnergy)
            expect(sneaker.hp).to.be.equal(100 - usedEnergy)
        })

        it("should refill user energy success", async ()=>{
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);
            // await move2EarnInstance.connect(user1).refillEnergy();
            const userEnergy = await move2EarnInstance.getUserEnergy(user1.address)
            expect(userEnergy.energy).to.be.equal(0)

            await move2EarnInstance.connect(owner).refillUserEnergy(user1.address)
            const userEnergy2 = await move2EarnInstance.getUserEnergy(user1.address)
            console.log({userEnergy})
            console.log({userEnergy2})

            expect(userEnergy2.energy).to.be.equal(userEnergy2.maxEnergy)
        })

        it("move success: should send reward to user (Full hp & durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.normalMove.durationCoeff / 100 *settings.move2Earn.normalMove.hpCoeff /100

            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })

        it("move success: should send reward to user ( full hp & <90 durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await sneakerInstance.connect(owner).decaySneaker(0, settings.move2Earn.smallDamageMove.decay, 0)
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.smallDamageMove.durationCoeff / 100 *settings.move2Earn.normalMove.hpCoeff /100

            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })

        it("move succes: should send reward to user (< 90 hp & full durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await sneakerInstance.connect(owner).decaySneaker(0, 0, settings.move2Earn.smallDamageMove.decay)
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.normalMove.durationCoeff / 100 *settings.move2Earn.smallDamageMove.hpCoeff /100

      
    
            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })

        it("move succes: should send reward to user (< 90 hp & <90 durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await sneakerInstance.connect(owner).decaySneaker(0, settings.move2Earn.smallDamageMove.decay, settings.move2Earn.smallDamageMove.decay)
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.smallDamageMove.durationCoeff / 100 *settings.move2Earn.smallDamageMove.hpCoeff /100

            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })

        it("move succes: should send reward to user (< 50 hp & <90 durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await sneakerInstance.connect(owner).decaySneaker(0, settings.move2Earn.smallDamageMove.decay, settings.move2Earn.highDamageMove.decay)
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.smallDamageMove.durationCoeff / 100 *settings.move2Earn.highDamageMove.hpCoeff /100

            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })

        it("move succes: should send reward to user (< 50 hp & <50 durability)", async () => {
            const sneaker = await sneakerInstance.getSneaker(0)
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)

            await sneakerInstance.connect(owner).decaySneaker(0, settings.move2Earn.highDamageMove.decay, settings.move2Earn.highDamageMove.decay)
            await move2EarnInstance.connect(user1).move2Earn(settings.move2Earn.tokenId, settings.move2Earn.normalMove.validSpeed, settings.move2Earn.normalMove.optimalDuration, true);

            let balanceUser1After = await GSTTokenInstance.balanceOf(user1.address)

            // calculate reward
            baseReaward = settings.move2Earn.normalMove.baseReward * 10 ** 18
            extraReward = Number(Bignumber2String(sneaker.attributes.efficiency)) * 10 ** 7
            energyUsed = settings.move2Earn.normalMove.optimalDuration / 5

            const reward = (baseReaward + extraReward) * energyUsed * settings.move2Earn.normalMove.speedCoeff / 100 * settings.move2Earn.highDamageMove.durationCoeff / 100 *settings.move2Earn.highDamageMove.hpCoeff /100

            expect(balanceUser1After.toString()).to.be.equal(balanceUser1Before.add(String(reward)).toString())
        })
    })


})


