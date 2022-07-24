const { expect } = require("chai");
const { ethers } = require('hardhat')

describe("RandomGnerator", function () {
    let randomGenerator;
    beforeEach(async () => {
        const RandomGenerator = await ethers.getContractFactory("RandomGenerator");

        randomGenerator = await RandomGenerator.deploy();
    })
    it("Should return a random number", async function () {


        await randomGenerator.deployed();
        let tx = await (await randomGenerator.getRandomNumber(0, 10)).wait();
        let rand = tx.events[0].args.random;

    });

    // test 20 random number that in range [0,10]
    it("should return multiple random number", async function () {
        await Promise.all(Array(20).fill(0).map(async () => {
            let tx = await (await randomGenerator.getRandomNumber(0, 10)).wait();
            expect(tx.events[0].args.random).to.be.at.least(0,10);
        }))
    })
 
});