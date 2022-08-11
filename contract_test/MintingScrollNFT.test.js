
const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { BigNumber } = require('bignumber.js')
const { Bignumber2String } = require('../utils/index')

describe("Minting scroll ", function () {
    let sneakerInstance, GSTTokenInstance, GMTTokenInstance, randomInstance,
        gemInstance, mintingScrollInstance, mysteryBoxInstance, shoeBoxInstance, move2EarnInstance;

    let owner, user1, user2, user3;
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

        mintingScrollInstance = await ethers.getContractFactory("MintingScrollNFT")
        mintingScrollInstance = await mintingScrollInstance.deploy(randomInstance.address)

        move2EarnInstance = await ethers.getContractFactory('Move2Earn')
        move2EarnInstance = await move2EarnInstance.deploy(sneakerInstance.address, mysteryBoxInstance.address)
        await move2EarnInstance.deployed()

        await sneakerInstance.initialize(GSTTokenInstance.address, GMTTokenInstance.address, gemInstance.address, mysteryBoxInstance.address, move2EarnInstance.address)

    })

    it("Should mint a scroll", async ()=>{
       await( await mintingScrollInstance.connect(owner).mintScroll(user1.address)).wait()
       let scroll = await mintingScrollInstance.getScroll(1)

       expect(scroll.owner).to.equal(user1.address)
       expect(Bignumber2String(scroll.id)).to.be.equal("1")
       expect(scroll.quality).to.be.within(0,4)
    })

    describe("--", function(){
        beforeEach(async ()=>{
            await( await mintingScrollInstance.connect(owner).mintScroll(user1.address)).wait()
            
        })

        it("Transfer a scroll: revert if the owner is not approve", async()=>{
            await expect(mintingScrollInstance.connect(owner).transferScroll(user1.address,user2.address, 1)).to.be.revertedWith("ERC721: caller is not token owner nor approved")
        })

        it("should transfer scroll success", async ()=>{
            await mintingScrollInstance.connect(user1).setApprovalForAll(owner.address, true)
            await mintingScrollInstance.connect(owner).transferScroll(user1.address,user2.address, 1)

            let scroll = await mintingScrollInstance.getScroll(1)

            expect(scroll.owner).to.equal(user2.address)
        })

        // it("Burn scroll: revert if the sender is not the contract owner", async ()=>{
        //     await expect(mintingScrollInstance.connect(user1).burnScroll(1)).to.be.revertedWith("Ownable: caller is not the owner")
        // })
        it("Burn scroll success", async ()=>{
            await mintingScrollInstance.connect(owner).burnScroll(1)

            let scroll = await mintingScrollInstance.getScroll(1)

            expect(scroll.owner).to.equal(ethers.constants.AddressZero)

            await expect( mintingScrollInstance.connect(owner).ownerOf(1)).to.be.revertedWith("ERC721: invalid token ID")
        })

    })
})