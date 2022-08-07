const { expect, should } = require('chai');
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { Bignumber2String } = require('../utils/index')
module.exports = describe('Gem', () => {
    let gemInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, MysteryBoxInstance;
    let owner, user1, user2, user3;
    let gemEvent;
    beforeEach(async () => {
        [owner, user1, user2, user3] = await ethers.getSigners()
        const Random = await ethers.getContractFactory('RandomGenerator');
        randomInstance = await Random.deploy();
        await randomInstance.deployed();

        const GSTToken = await ethers.getContractFactory('GSTToken');
        GSTTokenInstance = await GSTToken.deploy();
        await GSTTokenInstance.deployed();

        const GMTToken = await ethers.getContractFactory('GMTToken');
        GMTTokenInstance = await GMTToken.deploy();
        await GMTTokenInstance.deployed();

        const Gem = await ethers.getContractFactory('GemNFT');
        gemInstance = await Gem.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address);
        await gemInstance.deployed();

        const MysteryBox = await ethers.getContractFactory('MysteryBox');
        MysteryBoxInstance = await MysteryBox.deploy(randomInstance.address, gemInstance.address);
        await MysteryBoxInstance.deployed();

        gemInstance.setApproveMint(MysteryBoxInstance.address, true)
        let gemTx = await (await gemInstance.mint(user1.address, settings.gem.newGem.id)).wait();
        gemEvent = gemTx.events.filter(e => e.event == 'MintGem')[0].args;
    })

    it("mint gem > lv 3", async()=>{
        await (await gemInstance.mint(user2.address, 11)).wait()
        let gem  = await gemInstance.getGem(2)
        // console.log({gem})

    })

    it("Mint new Gem", async () => {

        const gemOwner = await gemInstance.ownerOf(1);
        expect(gemOwner).to.equal(user1.address);
        expect(gemEvent._owner).to.equal(user1.address);
        expect(gemEvent._id.toString()).to.equal(settings.gem.newGem.id);
        expect(gemEvent.gem.attribute).to.be.oneOf(settings.gem.newGem.attribute);
        expect(gemEvent.gem.baseAttribute).to.equal(settings.gem.newGem.baseAttribute);
        expect(gemEvent.gem.effectAttribute).to.equal(settings.gem.newGem.effectAttribute);
    })

    describe("Burn gem", function () {
        it("Burn gem: it should revert if the sender is no the owner of the gem", async () => {
            await expect(gemInstance.connect(user2).burn(settings.gem.newGem.id)).to.be.revertedWith("Only gem owner can call this function")
        })

        it("Should burn gem successful", async () => {

            await gemInstance.connect(user1).burn(settings.gem.newGem.id);

            await expect(gemInstance.ownerOf(settings.gem.newGem.id)).to.be.revertedWith("ERC721: invalid token ID");

            const burnedGem = await gemInstance.getGem(settings.gem.newGem.id);
            expect(burnedGem.owner).to.equal(settings.address0);

        })
    })

    describe("Transfer Gem", function () {
        it("should revert if the sender is not approve", async () => {
            await expect(gemInstance.connect(user2).transferGem(user1.address, user2.address, settings.gem.newGem.id)).to.be.revertedWith("ERC721: caller is not token owner nor approved")
        })

        it("should transfer from user1 gem to other successfull", async () => {
            await gemInstance.connect(user1).transferGem(user1.address, user2.address, settings.gem.newGem.id);

            const gemOwner = await gemInstance.ownerOf(settings.gem.newGem.id);
            expect(gemOwner).to.equal(user2.address);
        })

        it("should user1 approve for user2 to transfer gem to user3 success", async function () {
            await gemInstance.connect(user1).approve(user2.address, settings.gem.newGem.id);

            await gemInstance.connect(user2).transferGem(user1.address, user3.address, settings.gem.newGem.id);

            const gemOwner = await gemInstance.ownerOf(settings.gem.newGem.id);
            expect(gemOwner).to.equal(user3.address);
        })
    })
    describe("Combine Gem", function () {
        let gem1, gem2, gem3, gem4;
        beforeEach(async () => {
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user1.address, 3)

            gem1 = await gemInstance.getGem(1);
            gem2 = await gemInstance.getGem(2);
            gem3 = await gemInstance.getGem(3);
            gem4 = await gemInstance.getGem(4);

            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.newSneaker.one.levelingPrice)

            let user1BalanceBefore = await GSTTokenInstance.balanceOf(user1.address);
        })

        it("should revert if the sender is not the owner of the gem", async () => {
            await expect(gemInstance.connect(user2).combineGem(2, 3, 4)).to.be.revertedWith("Only gem owner can call this function")

        })

        it("should revert if 2 gems dont have the same level", async () => {
            await expect(gemInstance.connect(user1).combineGem(1, 2, 3)).to.be.revertedWith("3 gem must be the same level")
        })

        // it("combine 3 gems successfull", async () => {
        //     // user 1 approve to spent token for combine gem
        //     await GSTTokenInstance.connect(user1).approve(gemInstance.address, settings.gem.combine.price);
        //     // balance of user1 before combine
        //     let user1BalanceBefore = await GSTTokenInstance.balanceOf(user1.address);

        //     await gemInstance.connect(user1).combineGem( 2, 3,4);
        //     // balance of user1 after combine
        //     let user1BalanceAfter = await GSTTokenInstance.balanceOf(user1.address);

        //     // get owner of new minted gem
        //     const gemOwner = await gemInstance.ownerOf(6);
        //     expect(await gemOwner).to.equal(user1.address);

        //     // get gem after combine
        //     const newGem = await gemInstance.getGem(6);
        //     // console.log({newGem})
        //     expect(newGem.attribute).to.equal(gem2.attribute);
        //     expect(newGem.level).to.equal(settings.gem.combine.mintedLv);

        //     // test 3 gem had bee burn
        //     expect(gemInstance.ownerOf(2)).to.be.revertedWith("ERC721: invalid token ID");
        //     expect(gemInstance.ownerOf(3)).to.be.revertedWith("ERC721: invalid token ID");
        //     expect(gemInstance.ownerOf(4)).to.be.revertedWith("ERC721: invalid token ID");

        //     //test balance of user1 has been reduced
        //     expect(Bignumber2String(user1BalanceBefore)).to.equal(settings.gem.combine.price);
        //     expect(Bignumber2String(user1BalanceAfter)).to.equal('0');
        // })
    })

    describe("mint multiple gem", function(){
        it("should mint multiple gem successfull", async () => {
            await(await gemInstance.connect(owner).mint(user1.address, 2)).wait()
            await(await gemInstance.connect(owner).mint(user1.address, 2)).wait()
            await(await gemInstance.connect(owner).mint(owner.address, 2)).wait()
            await(await gemInstance.connect(owner).mint(user1.address, 3)).wait()
            await(await gemInstance.connect(owner).mint(owner.address, 2)).wait()
            await(await gemInstance.connect(owner).mint(user1.address, 4)).wait()

            await(await gemInstance.connect(owner).mint(owner.address, 5)).wait()
            await(await gemInstance.connect(owner).mint(user1.address, 6)).wait()

            const gem1 = await gemInstance.getGem(1);
            const gem2 = await gemInstance.getGem(2);
            const gem3 = await gemInstance.getGem(3);
            const gem4 = await gemInstance.getGem(4);
            const gem5 = await gemInstance.getGem(5);
            const gem6 = await gemInstance.getGem(6);
            const gem7 = await gemInstance.getGem(7);
            const gem8 = await gemInstance.getGem(8);

            console.log({gem1, gem2, gem3, gem4, gem5, gem6, gem7, gem8})
        })
    })
})