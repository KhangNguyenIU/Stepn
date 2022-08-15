# Move2Earn app

## Install
```
npm install 
cd client
npm install
```


## Testing
```
Yarn  test || npm run test
```

Chay test case tren test net
```
npx hardhat run scripts/test.js --network bsc_testnet

```

>> để test contract shoeBoxNFT

>> sửa contract MintingScrollNFT/_getRanDomQuality() thành 1 fix Quality

## Deploy

1. deploy  local
```
npx hardat run scripts/deploy.js
```
2. deploy bsc test net
```
npx hardhat run scripts/deploy.js --network bsc_testnet
```
## Thứ tự deploy contracts
1.	GSTToken()
2.	GMTToken()
3.	RandomGenerator()
4.	GemNFT( randomGenerator.address, GSTToken.address, GMTToken.address)
5.	SneakerNFT(randomGenerator.address)
6.	mintingScroll(randomGenerator.address)
7.	shoeBox(randomGenerator.address, sneakerNFT.address, mintingScroll.address)
8.	mysteryBox(randomGenerator.address,gemNFT.address)
9.	marketplace(feeRate, feeDecimal, GSTToken.address) // ex: feeRate: 2, feeDecimal: 4
10.	move2Earn(sneakerNFT.address, mysteryBox.address)
// 
11.	sneaker.initialize(GSTToken.address, GMTToken.address,gemNFT.address,shoeBox.address, move2Earn.address)
12.	gemNFT.setApproveMint(mysteryBox.address, true)


## Chạy các file mint mỗi khi deploy
1. Mint token
```
npx hardhat run scripts/mintToken.js --network bsc_testnet
```
2. Mint sneaker 
```
npx hardhat run scripts/mintSneaker.js --network bsc_testnet
```
3. Mint Gem
```
npx hardhat run scripts/mintGem.js --network bsc_testnet
```
4. Mint Mystery Box
```
npx hardhat run scripts/mintMysteryBox.js --network bsc_testnet
```

5 Mint Minting scroll
```
npx hardhat run scripts/mintMintingScroll.js --network bsc_testnet
```


