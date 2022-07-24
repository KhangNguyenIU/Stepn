const { expect } = require("chai");
const { ethers } = require('hardhat')
const {settings} = require('./settings')

// describe("Generate Sneaker stat", function () {
//     let randomGenerator
//     let generateSneakerStat
//     let sneakerNFT
//     it("Should return initial stat approriate due to Quality", async function () {
//         const RandomGenerator = await ethers.getContractFactory("RandomGenerator");
//         randomGenerator = await RandomGenerator.deploy();
//         await randomGenerator.deployed();

//         const GenerateSneakerState = await ethers.getContractFactory('GenerateSneakerBasisAttribute');
//         generateSneakerStat = await GenerateSneakerState.deploy(randomGenerator.address);
//         await generateSneakerStat.deployed();
  


//         await (await generateSneakerStat.setIRandom(randomGenerator.address)).wait()
//         let tx = await (await generateSneakerStat.generateStats(settings.quality.Legendary)).wait();
        
//         let [efficiency, luck, comfort, resilience] = tx.events.filter((x)=>x.event =="GenerateStats")[0].args

//         expect(efficiency).to.be.at.most(settings.initialAttributes.Legendary.max)
//         expect(efficiency).to.be.at.least(settings.initialAttributes.Legendary.min)
        
//         expect(luck).to.be.at.most(settings.initialAttributes.Legendary.max)
//         expect(luck).to.be.at.least(settings.initialAttributes.Legendary.min)

//         expect(comfort).to.be.at.most(settings.initialAttributes.Legendary.max)
//         expect(comfort).to.be.at.least(settings.initialAttributes.Legendary.min)

//         expect(resilience).to.be.at.most(settings.initialAttributes.Legendary.max)
//         expect(resilience).to.be.at.least(settings.initialAttributes.Legendary.min)
//         // console.log({efficiency,luck,comfort, resilience})
//     });
// });