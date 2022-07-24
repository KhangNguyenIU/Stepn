//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

contract RandomGenerator{
    uint private nonce;

    event RandomGenerated(uint16 min, uint16 max, uint256 random);
    
    // Get random number between min and max
    function getRandomNumber(uint16 _min, uint16 _max) external returns(uint256){
        require(_min < _max, "Invalid random range");
        nonce++;
        uint256 randomNumber =  uint256(keccak256(abi.encodePacked(block.number, nonce, msg.sender, block.timestamp, block.difficulty))) % (_max - _min+1);
        randomNumber += _min;
        emit RandomGenerated(_min,_max, randomNumber);
        return randomNumber;
    }
}