const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { Bignumber2String } = require('../utils/index')

describe("Marketplace", function () {
    let shoeBoxInstance, gemInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance, mintingScrollInstance, marketplaceInstance, move2EarnInstance;
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

        const MintingScroll = await ethers.getContractFactory('MintingScrollNFT');
        mintingScrollInstance = await MintingScroll.deploy(randomInstance.address);

        const ShoeBox = await ethers.getContractFactory('ShoeBoxNFT')
        shoeBoxInstance = await ShoeBox.deploy(randomInstance.address, sneakerInstance.address, mintingScrollInstance.address);
        await shoeBoxInstance.deployed()

        const Move2Earn = await ethers.getContractFactory('Move2Earn')
        move2EarnInstance = await Move2Earn.deploy(sneakerInstance.address)
        await move2EarnInstance.deployed()

        await sneakerInstance.connect(owner).initialize(GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, shoeBoxInstance.address, move2EarnInstance.address);


        const MarketPlace = await ethers.getContractFactory('Marketplace')
        marketplaceInstance = await MarketPlace.deploy(settings.marketplace.feeRate, settings.marketplace.feeDecimal, GSTTokenInstance.address);
        await marketplaceInstance.deployed()

    })
    
    it("should return the right fee info", async () => {
        const [feeRate, feeDecimal, feeRecipient] = await marketplaceInstance.getFeeInfo()
        expect(Bignumber2String(feeRate)).to.equal(settings.marketplace.feeRate)
        expect(Bignumber2String(feeDecimal)).to.equal(settings.marketplace.feeDecimal)
        expect(feeRecipient).to.equal(owner.address)
    })

    describe('Update fee infomation', async () => {
        it("Should revert if the sender is not the contract owner", async () => {
            await expect(marketplaceInstance.connect(user1).updateFee(settings.marketplace.update.feeRate, settings.marketplace.update.feeDecimal, user1.address)).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should update Fee information success", async () => {
            await marketplaceInstance.connect(owner).updateFee(settings.marketplace.update.feeRate, settings.marketplace.update.feeDecimal, user1.address)

            const [feeRate, feeDecimal, feeRecipient] = await marketplaceInstance.getFeeInfo()

            expect(Bignumber2String(feeRate)).to.equal(settings.marketplace.update.feeRate)
            expect(Bignumber2String(feeDecimal)).to.equal(settings.marketplace.update.feeDecimal)
            expect(feeRecipient).to.equal(user1.address)
        })
    })

    describe("Add NFT type", function () {
        it("should revert if the sender is not the owner of the contract", async () => {
            await expect(marketplaceInstance.connect(user1).addNewNFTType(sneakerInstance.address)).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("should revert if adding address 0x0", async () => {
            await expect(marketplaceInstance.connect(owner).addNewNFTType(settings.address0)).to.be.revertedWith("Marketplace: NFT address is not valid")
        })

        it("should remove address from NFT address list success ", async () => {
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)

            await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)

            let NFTaddressList = await marketplaceInstance.getNFTTypes()

            await expect(NFTaddressList).to.be.eql([sneakerInstance.address, gemInstance.address])

            // remove Gem NFT 
            await marketplaceInstance.connect(owner).removeNFTType(sneakerInstance.address)

            NFTaddressList = await marketplaceInstance.getNFTTypes()

            await expect(NFTaddressList).to.be.include(gemInstance.address)

            // revert because gem is already removed
            await expect(marketplaceInstance.connect(owner).removeNFTType(sneakerInstance.address)).to.be.revertedWith("Marketplace: NFT address does not exist")
        })

        it("should add new NFT type success", async () => {
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)

            const nftTypes = await marketplaceInstance.getNFTTypes()
            expect(nftTypes).to.include(sneakerInstance.address)
        })
    })
    describe("Make offer", function () {
        beforeEach(async () => {
            await sneakerInstance.mint(user1.address, 1, 2, [0, 0])
            await gemInstance.mint(user1.address, 1)

            // add NFT type address to marketplace
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)
        })

        it("should revert if the sender is not the owner of NFT", async () => {
            await expect(marketplaceInstance.connect(owner).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)).to.be.revertedWith("Marketplace: only nft owner can make offer")
        })

        it("should revert if the NFT address is not in list", async () => {
            await marketplaceInstance.removeNFTType(sneakerInstance.address)

            await expect(marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)).to.be.revertedWith("Marketplace does not support this NFT")
        })

        it("should revert if the user not approve to spend offer fee to marketplace", async () => {
            // mint token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.marketplace.fee)

            // user1 approve to transfer sneakerNFT to marketplace
            sneakerInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)

            await expect(marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)).to.be.revertedWith("BEP20: transfer amount exceeds allowance")
        })

        it("should revert if the seller not approve nft for marketplace", async () => {
            // mint token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.marketplace.fee)

            // user1 approve to spend offer fee for marketplace
            GSTTokenInstance.connect(user1).approve(marketplaceInstance.address, settings.marketplace.fee)

            await expect(marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)).to.be.revertedWith("ERC721: caller is not token owner nor approved")
        })

        it("should make offer success", async () => {
            // mint token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.marketplace.fee)

            // user1 approve to spend offer fee for marketplace
            GSTTokenInstance.connect(user1).approve(marketplaceInstance.address, settings.marketplace.fee)

            // user1 approve to transfer sneakerNFT to marketplace
            sneakerInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)

            await marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)

            const offer = await marketplaceInstance.getOffer(0)

            expect(offer.seller).to.equal(user1.address)
            expect(offer.tokenId).to.equal(settings.marketplace.offer.tokenId)
            expect(Bignumber2String(offer.price)).to.equal(settings.marketplace.offer.price)
            expect(offer.NFTaddress).to.be.equal(sneakerInstance.address)
            expect(offer.sold).to.be.equal(settings.marketplace.offer.sold)
        })
    })

    describe("cancel order", function () {
        beforeEach(async () => {
            await sneakerInstance.mint(user1.address, 1, 2, [0, 0])
            await gemInstance.mint(user1.address, 1)

            // add NFT address to marketplace
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)

            // mint token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.marketplace.fee)

            // user1 approve to spend offer fee for marketplace
            GSTTokenInstance.connect(user1).approve(marketplaceInstance.address, settings.marketplace.fee)

            // user1 approve to transfer sneakerNFT to marketplace
            sneakerInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)

            await marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)
        })

        it("should revert if the sender is not the owner of NFT", async () => {
            await expect(marketplaceInstance.connect(owner).cancelOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Only owner can cancel offer")
        })

        it("should revert if the NFT address is not in list", async () => {
            await marketplaceInstance.removeNFTType(sneakerInstance.address)

            await expect(marketplaceInstance.connect(user1).cancelOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Marketplace: NFT address is not supported")
        })

        it("should revert if the offer has been execute", async () => {
            await GSTTokenInstance.mintTo(user2.address, settings.marketplace.offer.price)
            await GSTTokenInstance.connect(user2).approve(marketplaceInstance.address, settings.marketplace.fee)
            await marketplaceInstance.connect(user2).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)

            await expect(marketplaceInstance.connect(user1).cancelOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Marketplace: Offer is already sold")
        })

        it("should cancel offer success ", async () => {
            await marketplaceInstance.connect(user1).cancelOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)

            expect(await sneakerInstance.ownerOf(settings.marketplace.offer.tokenId)).to.be.equal(user1.address)

            const offer = await marketplaceInstance.getOffer(settings.marketplace.offer.id)

            expect(offer.seller).to.equal(settings.address0)
            expect(offer.owner).to.equal(settings.address0)
            expect(offer.NFTaddress).to.equal(settings.address0)
            expect(offer.sold).to.equal(false)
            expect(Bignumber2String(offer.price)).to.equal("0")
        })

    })

    describe("Execute offer", function () {
        beforeEach(async () => {
            await sneakerInstance.mint(user1.address, 1, 2, [0, 0])
            await gemInstance.mint(user1.address, 1)

            // add NFT address to marketplace
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)

            // mint token for user1
            await GSTTokenInstance.connect(owner).mintTo(user1.address, settings.marketplace.fee)

            // user1 approve to spend offer fee for marketplace
            GSTTokenInstance.connect(user1).approve(marketplaceInstance.address, settings.marketplace.fee)

            // user1 approve to transfer sneakerNFT to marketplace
            sneakerInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)

            await marketplaceInstance.connect(user1).makeOffer(settings.marketplace.offer.tokenId, settings.marketplace.price, sneakerInstance.address)
        })

        it("should revert if the sender is the owner of the offer", async () => {
            await expect(marketplaceInstance.connect(user1).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Marketplace: Owner cannot execute offer")
        })

        it("should revert if the NFT type address is not supported by marketplace", async () => {
            await marketplaceInstance.removeNFTType(sneakerInstance.address)

            await expect(marketplaceInstance.connect(user2).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Marketplace: NFT address is not supported")

        })

        it("should revert if execute an offer not exist", async () => {

            let balanceUser2Before = await GSTTokenInstance.balanceOf(user2.address)
            await expect(marketplaceInstance.connect(user2).executeOffer(2, sneakerInstance.address)).to.be.revertedWith("BEP20: transfer to the zero address")

            let sneakerOwner = await sneakerInstance.ownerOf(settings.marketplace.offer.tokenId)
            let balanceUser2After = await GSTTokenInstance.balanceOf(user2.address)

            // test: marketplace still hold the nft
            expect(sneakerOwner).to.be.equal(marketplaceInstance.address)

            // test: user2 balance is unchanged 
            expect(Bignumber2String(balanceUser2Before)).to.be.equal(Bignumber2String(balanceUser2After))
        })

        it("should revert if the offer has been cancelled", async () => {
            await marketplaceInstance.connect(user1).cancelOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)

            let offer = await marketplaceInstance.getOffer(settings.marketplace.offer.id)

            await expect(marketplaceInstance.connect(user2).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("BEP20: transfer to the zero address")
        })

        it("should revert if the off has already been sold", async () => {
            await GSTTokenInstance.mintTo(user2.address, settings.marketplace.offer.price)
            await GSTTokenInstance.connect(user2).approve(marketplaceInstance.address, settings.marketplace.fee)
            await marketplaceInstance.connect(user2).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)

            await expect(marketplaceInstance.connect(owner).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)).to.be.revertedWith("Marketplace: Offer is already sold")
        })

        it("should execute offer success", async ()=>{
            // console.log({owner: owner.address,user1: user1.address, user2: user2.address, marketplaceInstance:marketplaceInstance.address})
            let sneakerBefore = await sneakerInstance.ownerOf(settings.marketplace.offer.tokenId)
            // console.log({sneakerBefore})
            await GSTTokenInstance.connect(owner).mintTo(user2.address,settings.marketplace.price)
            await GSTTokenInstance.connect(user2).approve(marketplaceInstance.address, settings.marketplace.price)
            await marketplaceInstance.connect(user2).executeOffer(settings.marketplace.offer.tokenId, sneakerInstance.address)

            const sneakerAfter = await sneakerInstance.ownerOf(settings.marketplace.offer.tokenId)
            // console.log({sneakerAfter})

            const map = await marketplaceInstance.getOffer(3)
            // console.log("map",map)
        }) 
    })

    describe("Get list NFT of a user", function () {
        beforeEach(async () => {
            await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(mintingScrollInstance.address)
            await marketplaceInstance.connect(owner).addNewNFTType(shoeBoxInstance.address)

            await sneakerInstance.connect(owner).mint(user1.address, 2, 2, [0, 0])
            await sneakerInstance.connect(owner).mint(user1.address, 1, 3, [0, 0])

            await gemInstance.connect(owner).mint(user1.address, 1)
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user2.address, 3)
            await gemInstance.connect(owner).mint(user1.address, 3)

            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address )
        })
        it("should return list of NFT of a user", async () => {

            //sneaker
            let listNFTsneakerIDs = await marketplaceInstance.connect(user1).getNFTidsOfUser(sneakerInstance.address)
            let listSnkears =[]
            await Promise.all(listNFTsneakerIDs.map(async (id)=>{
                let snekear = await sneakerInstance.getSneaker(id)
                listSnkears.push(snekear)
            }))
            // console.log({listSnkears})


            // Minting scroll
            let listMSids = await marketplaceInstance.connect(user1).getNFTidsOfUser(mintingScrollInstance.address)
            let listMintingScrolls = []
            await Promise.all(listMSids.map(async (id)=>{
                let mintScroll = await mintingScrollInstance.getScroll(id)
                listMintingScrolls.push(mintScroll)
            }))

            // console.log({listMintingScrolls})

            // Gem
            let listGemIds = await marketplaceInstance.connect(user1).getNFTidsOfUser(gemInstance.address)
            let listGems = []

            await Promise.all(listGemIds.map(async (id)=>{
                let gem = await gemInstance.getGem(id)
                listGems.push(gem)
            }))

            // console.log({listGems})

            // shoebox
            let listShoeBoxIds = await marketplaceInstance.connect(user1).getNFTidsOfUser(shoeBoxInstance.address)
            let listShoeBoxes = []
            await Promise.all(listShoeBoxIds.map(async (id)=>{
                let shoeBox = await shoeBoxInstance.getShoeBox(id)
                listShoeBoxes.push(shoeBox)
            }
            ))
            // console.log({listShoeBoxes})
        })

    })

    describe("get list of listing NFT of one NFT type in marketplace", function () {

        beforeEach(async () => {
            await (await marketplaceInstance.connect(owner).addNewNFTType(sneakerInstance.address)).wait()
            await (await marketplaceInstance.connect(owner).addNewNFTType(gemInstance.address)).wait()
            await (await marketplaceInstance.connect(owner).addNewNFTType(mintingScrollInstance.address)).wait()
            await (await marketplaceInstance.connect(owner).addNewNFTType(shoeBoxInstance.address)).wait()

            //mint NFT          
            await sneakerInstance.connect(owner).mint(user1.address, 2, 2, [0, 0])
            await sneakerInstance.connect(owner).mint(user1.address, 1, 3, [0, 0])

            await gemInstance.connect(owner).mint(user1.address, 1)
            await gemInstance.connect(owner).mint(user1.address, 2)
            await gemInstance.connect(owner).mint(user2.address, 3)
            await gemInstance.connect(owner).mint(user1.address, 3)

            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user2.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address)
            await mintingScrollInstance.connect(owner).mintScroll(user1.address)

            // listing NFT
            await sneakerInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)
            await gemInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)
            await mintingScrollInstance.connect(user1).setApprovalForAll(marketplaceInstance.address, true)

            await GSTTokenInstance.connect(owner).mintTo(user1.address, '1000000000000000000000')
            await GSTTokenInstance.connect(user1).approve(marketplaceInstance.address, '1000000000000000000000')
            let balanceUser1Before = await GSTTokenInstance.balanceOf(user1.address)
            // console.log({ before: balanceUser1Before.toString() })
            await marketplaceInstance.connect(user1).makeOffer(1, '100000000000000000', sneakerInstance.address)

            await marketplaceInstance.connect(user1).makeOffer(1, '150000000000000000', gemInstance.address)
            await marketplaceInstance.connect(user1).makeOffer(2, '250000000000000000', gemInstance.address)
            await marketplaceInstance.connect(user1).makeOffer(4, '350000000000000000', gemInstance.address)

            await marketplaceInstance.connect(user1).makeOffer(1, '100000000000000000', mintingScrollInstance.address)
            await marketplaceInstance.connect(user1).makeOffer(3, '200000000000000000', mintingScrollInstance.address)
            await marketplaceInstance.connect(user1).makeOffer(6, '300000000000000000', mintingScrollInstance.address)
            await marketplaceInstance.connect(user1).makeOffer(7, '400000000000000000', mintingScrollInstance.address)

            let balaneUser1After = await GSTTokenInstance.balanceOf(user1.address)
            // console.log({ after: balaneUser1After.toString() })

        })

        it("should return nfts listing on marketplace", async () => {
            let listSneakerIds = await marketplaceInstance.connect(user1).getNFTsOfNFTtype(sneakerInstance.address)
            // console.log({ listSneakerIds })
            let listGemIds = await marketplaceInstance.connect(user1).getNFTsOfNFTtype(gemInstance.address)
            // console.log({ listGemIds })
            let listMintingScrollIds = await marketplaceInstance.connect(user1).getNFTsOfNFTtype(mintingScrollInstance.address)
            // console.log({ listMintingScrollIds })

            const offer1 = await marketplaceInstance.iDToOffers_(1)
            const sneaker1 = await sneakerInstance.getSneaker(offer1.tokenId.toString())
            // console.log({offer1, sneaker1})
        })
    })

})