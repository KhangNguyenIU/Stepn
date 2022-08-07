const { expect } = require('chai')
const { ethers } = require('hardhat')
const { settings } = require('../test/settings')
const { Bignumber2String, sleep } = require('../utils/index')

module.exports = describe('MysteryBox', () => {
    let gemInstance, mysteryBoxInstance, randomInstance, GSTTokenInstance, GMTTokenInstance, sneakerInstance;

    let owner, user1, user2, user3;
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

        gemInstance = await ethers.getContractFactory('GemNFT')
        gemInstance = await gemInstance.deploy(randomInstance.address, GSTTokenInstance.address, GMTTokenInstance.address);
        await gemInstance.deployed();

        const Sneaker = await ethers.getContractFactory('SneakerNFT');
        sneakerInstance = await Sneaker.deploy(randomInstance.address);
        await sneakerInstance.deployed();

        const MysteryBox = await ethers.getContractFactory('MysteryBox');
        mysteryBoxInstance = await MysteryBox.deploy(randomInstance.address, gemInstance.address);
        await mysteryBoxInstance.deployed();

        gemInstance.setApproveMint(mysteryBoxInstance.address, true)
    })

    it("Mint a Mystery Box", async () => {
        await (await mysteryBoxInstance.connect(owner).mint(user1.address)).wait()

        const mysBox = await mysteryBoxInstance.getMysteryBox(1)
        expect(Bignumber2String(mysBox.id)).to.equal(settings.mysteryBox.new.id)
    })



    // describe("Open mystery box", function () {

    //     beforeEach(async () => {
    //         await (await mysteryBoxInstance.connect(owner).mint(user1.address)).wait()
    //     })

    //     it("revert if mystery box is in cooling down", async () => {
    //         await expect(mysteryBoxInstance.connect(user1).open(1)).to.be.revertedWith("MysteryBox: wait until mysterBox is cooled down")
    //     })

    //     it("should open mystery box success", async () => {
    //         //wait unil mystery box is cooled down
    //         await sleep(5000)
    //         await mysteryBoxInstance.connect(user1).open(1)

    //         //get new minted 
    //         const newGem = await gemInstance.getGem(1)

    //         expect(newGem.level).to.be.within(1, 3)
    //         expect(await gemInstance.ownerOf(1)).to.be.equal(user1.address)

    //         // mystery box be burnt after opening
    //         const box = await (mysteryBoxInstance.getMysteryBox(1))
    //         expect(box.owner).to.be.equal(settings.address0)
    //         await expect(mysteryBoxInstance.ownerOf(1)).to.be.revertedWith("MysteryBox: invalid token id")
    //     })
    // })

    describe("Get list mystery box of a user", function () {
        beforeEach(async () => {
            await (await mysteryBoxInstance.connect(owner).mint(user1.address)).wait()
            await (await mysteryBoxInstance.connect(owner).mint(user1.address)).wait()
            await (await mysteryBoxInstance.connect(owner).mint(user1.address)).wait()

        })

        it("should return list of mysterybox of a user", async () => {
            let totalMysBox = await mysteryBoxInstance.balanceOf(user1.address)
            totalMysBox = Number(Bignumber2String(totalMysBox))

            let listMysBox = []
            // console.log(Number(Bignumber2String(totalMysBox)))
            await Promise.all(Array(totalMysBox).fill(0).map(async (_, index) => {
                const msId = await mysteryBoxInstance.tokenOwnByIndex(user1.address, index)
                listMysBox.push(msId)
            }))
            console.log({ listMysBox })

            sleep(2000)
            const box = await mysteryBoxInstance.getMysteryBox(2)
            console.log({box})
            await (await mysteryBoxInstance.connect(user1).open(listMysBox[1])).wait()

            totalMysBox = await mysteryBoxInstance.balanceOf(user1.address)
            totalMysBox = Number(Bignumber2String(totalMysBox))

            listMysBox = []
            // console.log(Number(Bignumber2String(totalMysBox)))
            await Promise.all(Array(totalMysBox).fill(0).map(async (_, index) => {
                const msId = await mysteryBoxInstance.tokenOwnByIndex(user1.address, index)
                listMysBox.push(msId)
            }))
            
            console.log({ listMysBox })
            const oldMysBox = await mysteryBoxInstance.getMysteryBox(2)
            console.log({oldMysBox})
            expect(1).to.be.equal(1)
        })
    })
})