# Move2Earn app


## Testing
```
Yarn  test || npm run test
```

>> để test contract shoeBoxNFT

>> sửa contract MintingScrollNFT/_getRanDomQuality() thành 1 fix Quality

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


