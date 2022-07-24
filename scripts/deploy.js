async function main() {
    const MyCryptoLions = await hre.ethers.getContractFactory("MyCryptoLions");
  
    await myCryptoLions.deployed();
  
    console.log("MyCryptoLions deployed to:", myCryptoLions.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });