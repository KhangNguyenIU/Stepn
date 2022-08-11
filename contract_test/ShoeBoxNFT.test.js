
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { BigNumber } = require('bignumber.js')
const { Bignumber2String, sleep } = require('../utils/index')


describe("Shoe Box", function () {
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

        const Move2Earn = await ethers.getContractFactory('Move2Earn')
        move2EarnInstance = await Move2Earn.deploy(sneakerInstance.address, mysteryBoxInstance.address)
        await move2EarnInstance.deployed()

        const MintingScroll = await ethers.getContractFactory('MintingScrollNFT');
        mintingScrollInstance = await MintingScroll.deploy(randomInstance.address);
        // await mintingScrollInstance.deployed();


        const ShoeBox = await ethers.getContractFactory('ShoeBoxNFT')
        shoeBoxInstance = await ShoeBox.deploy(randomInstance.address, sneakerInstance.address, mintingScrollInstance.address);
        await shoeBoxInstance.deployed()

        await sneakerInstance.connect(owner).initialize(GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, shoeBoxInstance.address, move2EarnInstance.address);
    })

    it("get probability", async () => {
        const proba = await shoeBoxInstance.getProbability(settings.shoeBox.quality1, settings.shoeBox.quality2);
        expect(proba).to.be.eql(settings.shoeBox.proba)
    })

    describe("Mint shoe box", function () {

        beforeEach(async () => {
            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality1, settings.shoeBox.sneakerType1, [0, 0]);

            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality2, settings.shoeBox.sneakerType2, [0, 0]);

            // await mintingScrollInstance.connect(owner).mint()
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);


        })

        it("Should revert it sender is not the owner of the sneaker", async () => {

            await expect(shoeBoxInstance.connect(user2).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).to.be.revertedWith("ShoeBoxNFT: Only sneaker owner can mint ShoeBox")
        })

        it("Should revert if mint 2 identical sneaker", async () => {
            await expect(shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker1, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).to.be.revertedWith("ShoeBoxNFT: cannot mint 2 same sneakers")
        })

        it("should revert if 2 scroll are identical", async ()=>{
            await expect(shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll1)).to.be.revertedWith("ShoeBoxNFT: cannot mint 2 same minting scrolls")
        })

        it("should mint success", async () => {
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()

            const newShoeBox = await shoeBoxInstance.getShoeBox(1)
            expect(Bignumber2String(newShoeBox.id)).to.be.equal('1')
            expect(newShoeBox.owner).to.be.equal(user1.address)
            expect(newShoeBox.parentSneaker1).to.be.equal(settings.shoeBox.sneaker1)
            expect(newShoeBox.parentSneaker2).to.be.equal(settings.shoeBox.sneaker2)
            // console.log({ newShoeBox })

            // test mintCount of parent sneaker has increase 1
            const sneaker1AfterMint = await sneakerInstance.getSneaker(settings.shoeBox.sneaker1)
            const sneaker2AfterMint = await sneakerInstance.getSneaker(settings.shoeBox.sneaker2)
            // console.log({ sneaker1AfterMint, sneaker2AfterMint })
            expect(sneaker1AfterMint.mintCount).to.be.equal(1)
            expect(sneaker2AfterMint.mintCount).to.be.equal(1)
        })

        it("Should revert if excess mintCount", async () => {

            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()

            await expect(shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).to.be.revertedWith("SneakerNFT: Max mint count reached")

        })
    })

    describe("Open shoe box", function () {

        beforeEach(async () => {
            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality1, settings.shoeBox.sneakerType1, [0, 0]);

            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality2, settings.shoeBox.sneakerType2, [0, 0]);
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
        })

        it("revert if the sender is not the owner of the box", async () => {
            const shoeBox = await shoeBoxInstance.getShoeBox(1)
            await expect(shoeBoxInstance.connect(user2).open(1)).to.be.revertedWith("ShoeBoxNFT: Only owner can open")
        })

        it("should open shoe box success", async () => {

            await (await shoeBoxInstance.connect(user1).open(1)).wait()

            let newSneaker = await sneakerInstance.getSneaker(settings.shoeBox.newSneaker)

            expect(newSneaker.owner).to.be.equal(user1.address)
            expect(newSneaker.mintCount).to.be.equal(0)


            // test if the shoe box has been burnt
            shoeBox = await shoeBoxInstance.getShoeBox(1)
            await expect(shoeBoxInstance.ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID")
            expect(shoeBox.owner).to.be.equal(settings.address0)
        })
    })

    describe("Transfer shoe box", function () {
        beforeEach(async () => {
            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality1, settings.shoeBox.sneakerType1, [0, 0]);

            await sneakerInstance.connect(owner).mint(user1.address, settings.shoeBox.quality2, settings.shoeBox.sneakerType2, [0, 0]);
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);
            await mintingScrollInstance.connect(owner).mintScroll(user1.address);
            await (await shoeBoxInstance.connect(user1).mint(settings.shoeBox.sneaker1, settings.shoeBox.sneaker2, settings.shoeBox.scroll1, settings.shoeBox.scroll2)).wait()
        })

        it("should revert if the sender not approve", async () => {
            await expect(shoeBoxInstance.connect(owner).transferShoeBox(user1.address, user2.address, 1)).to.be.revertedWith("ERC721: caller is not token owner nor approved")
        })
        it("should transfer shoe box success", async () => {
            await shoeBoxInstance.connect(user1).setApprovalForAll(owner.address, true)
            await (await shoeBoxInstance.connect(user1).transferShoeBox(user1.address, user2.address, 1)).wait()

            const shoeBox = await shoeBoxInstance.getShoeBox(1)
            expect(shoeBox.owner).to.be.equal(user2.address)
        })
    })
})