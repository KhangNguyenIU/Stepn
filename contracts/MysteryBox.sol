//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

interface IGem {
    function mint(address _to, uint8 _level) external;
}

contract MysteryBox is Ownable {
    IRandom iRandom;
    IGem iGem;

    uint256 idCounter;
    uint256 coolDownTime;

    struct MysBox {
        uint256 id;
        address owner;
        uint256 coolDown;
    }

    constructor(address _iRandom, address _iGem) {
        iRandom = IRandom(_iRandom);
        iGem = IGem(_iGem);
        idCounter = 1;
        coolDownTime = block.timestamp + 5 seconds;
    }

    mapping(uint256 => MysBox) allMysBox_;
    mapping(uint256 => address) _owners;
    mapping(address => uint256) _balances;

    event MintMysteryBox(address indexed _owner, uint256 indexed _id);
    event BurnMysteryBox(address owner, uint256 tokenId);

    function open(uint256 _tokenId) external {
        require(_msgSender() == ownerOf(_tokenId));
        MysBox storage mysBox = allMysBox_[_tokenId];
        require(
            block.timestamp > mysBox.coolDown,
            "MysteryBox: wait until mysterBox is cooled down"
        );

        uint256 randomLevel = iRandom.getRandomNumber(1, 3);
        iGem.mint(_msgSender(), uint8(randomLevel));
        _burn(_tokenId);

    }

    function mint(address _to) external onlyOwner {
        require(_to != address(0), "address is not valid");
        MysBox memory myBox = MysBox(idCounter, _to, coolDownTime);
        allMysBox_[idCounter] = myBox;
        _owners[idCounter] = _to;
        _balances[_to]++;
        emit MintMysteryBox(_to, idCounter);
        idCounter++;
    }

    function _burn(uint256 _tokenId) internal {
        require(
            _msgSender() == ownerOf(_tokenId) || _msgSender() == owner(),
            "MysteryBox: Unatuthorized to burn nft"
        );
        delete allMysBox_[_tokenId];
        _balances[_msgSender()]--;
        _owners[_tokenId] = address(0);
        emit BurnMysteryBox(_msgSender(), _tokenId);
    }

    function getMysteryBox(uint256 _tokenId) public view returns (MysBox memory) {
        return allMysBox_[_tokenId];
    }

    function setCoolDownTime(uint256 _coolDownTime) external onlyOwner {
        coolDownTime = _coolDownTime;
    }

    function ownerOf(uint256 _tokenId) public view returns (address owner) {
        owner = _owners[_tokenId];
        require(owner != address(0), "MysteryBox: invalid token id");
    }


}
