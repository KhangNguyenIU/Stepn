const { expect } = require("chai");
const { ethers } = require('hardhat')
const { BigNumber } = require('bignumber.js')

describe("GST Token", function () {
    let GMTToken;
    let gstToken;
    let owner, user1, user2, user3;
    beforeEach(async () => {
        const signers = await ethers.getSigners();
        owner = signers[0];
        user1 = signers[1];
        user2 = signers[2];
        user3 = signers[3];

        GMTToken = await ethers.getContractFactory("GSTToken");
        gstToken = await GMTToken.deploy();

        await gstToken.deployed();
    })


    it("should return correct token info ", async function () {

        expect(await gstToken.name()).to.equal("Green Satoshi Token");
        expect(await gstToken.symbol()).to.equal("GST");
        expect(await gstToken.decimals()).to.equal(18);

        let _totalSupply = BigNumber("6000000000000000000000000")

        let totalSupply = await gstToken.totalSupply()
        totalSupply = BigNumber(totalSupply.toString())

        expect(totalSupply.toString()).to.equal(_totalSupply.toString());

    });

    it("should return correct balance of owner", async function () {
        let balance = await gstToken.balanceOf(owner.address);
        balance = BigNumber(balance.toString())

        let _totalSupply = BigNumber("6000000000000000000000000")
        expect(balance.toString()).to.equal(_totalSupply.toString());
    })

    it("should return correct balance of user1", async function () {
        let balance = await gstToken.balanceOf(user1.address);
        balance = BigNumber(balance.toString())

        let balanceOfOwnerBefore = await gstToken.balanceOf(owner.address);
        balanceOfOwnerBefore = BigNumber(balanceOfOwnerBefore.toString())

        // balance of user 1 before transfer
        let _totalSupply = BigNumber("0")
        expect(balance.toString()).to.equal(_totalSupply.toString());

        // transfer from owner to user1
        await gstToken.connect(owner).transfer(user1.address, "100000000");

        // balance of user 1 after transfer
        balance = await gstToken.balanceOf(user1.address);
        balance = BigNumber(balance.toString())
        _totalSupply = BigNumber("100000000")
        expect(balance.toString()).to.equal(_totalSupply.toString());


        //balance of owner after transfer 100000000 to user 1
        balanceAfter = await gstToken.balanceOf(owner.address);
        balanceAfter = new BigNumber(balanceAfter.toString())
        expect(balanceAfter.plus("100000000").toString()).to.equal(balanceOfOwnerBefore.toString());
    })

    it("should total supply return correct value when mint", async function(){

        //total supply before mint
        let totalSupply = await gstToken.totalSupply()
        totalSupply = BigNumber(totalSupply.toString())

        let _totalSupply = BigNumber("6000000000000000000000000")
        expect(totalSupply.toString()).to.equal(_totalSupply.toString());

        //total supply after mint
        await gstToken.connect(owner).mint("100000000");
        totalSupply = await gstToken.totalSupply()
        totalSupply = new BigNumber(totalSupply.toString())
        _totalSupply = BigNumber("6000000000000000000000000")
        expect(totalSupply.minus("100000000").toString()).to.equal(_totalSupply.toString());
    })

    it("transfer all token of user1", async()=>{
        
        await gstToken.connect(owner).transfer(user1.address, "100000000"); 

        let balanceOfUser1Before = await gstToken.balanceOf(user1.address);
        // console.log({balanceOfUser1Before})

        await gstToken.connect(user1).transfer(user2.address,"100000000");

        let balanceOfUser1After = await gstToken.balanceOf(user1.address);
        // console.log({balanceOfUser1After})
    })
}); 