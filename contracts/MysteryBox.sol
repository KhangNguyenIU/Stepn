//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

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

    uint256 public coolDownTime;
    struct MysBox {
        uint256 id;
        address owner;
        uint256 coolDown;
    }

    constructor(address _iRandom, address _iGem) {
        iRandom = IRandom(_iRandom);
        iGem = IGem(_iGem);
        idCounter = 1;
        coolDownTime = 1 minutes;
    }

    mapping(uint256 => MysBox) allMysBox_;

    // map from tokenId to list of owned  token Ids
    mapping(address => mapping(uint256 => uint256)) private _ownedTokens;

    // map from tokenId to index of the owner tokens list
    mapping(uint256 => uint256) private _ownedTokensIndex;

    mapping(uint256 => address) _owners;
    mapping(address => uint256) _balances;

    event MintMysteryBox(address indexed _owner, uint256 indexed _id);
    event BurnMysteryBox(address owner, uint256 tokenId);

    function mint(address _to) external {
        require(_to != address(0), "address is not valid");
        MysBox memory myBox = MysBox(idCounter, _to, block.timestamp + 30 seconds);
        allMysBox_[idCounter] = myBox;

        _ownedTokens[_to][balanceOf(_to)] = idCounter;
        _ownedTokensIndex[idCounter] = balanceOf(_to);

        _owners[idCounter] = _to;
        _balances[_to]++;

        emit MintMysteryBox(_to, idCounter);
        idCounter++;
    }

    function open(uint256 _tokenId) external {
        require(_msgSender() == ownerOf(_tokenId));
        MysBox storage mysBox = allMysBox_[_tokenId];
        console.log("CONTRACT", block.timestamp, mysBox.coolDown);
        require(
            block.timestamp > mysBox.coolDown,
            "MysteryBox: wait until mysterBox is cooled down"
        );

        uint256 randomLevel = iRandom.getRandomNumber(1, 3);
        iGem.mint(_msgSender(), uint8(randomLevel));
        _burn(_tokenId);
    }

 

    function balanceOf(address _address) public view returns (uint256) {
        return _balances[_address];
    }

    function tokenOwnByIndex(address _owner, uint256 _index)
        external
        view
        returns (uint256)
    {
        require(_index < balanceOf(_owner), "MysteryBox: index out of bound");
        return _ownedTokens[_owner][_index];
    }

    function _burn(uint256 _tokenId) internal {
        require(
            _msgSender() == ownerOf(_tokenId) || _msgSender() == owner(),
            "MysteryBox: Unatuthorized to burn nft"
        );
        _ownedTokens[_owners[_tokenId]][
            _ownedTokensIndex[_tokenId]
        ] = _ownedTokens[_owners[_tokenId]][balanceOf(_owners[_tokenId]) - 1];
        _ownedTokens[_owners[_tokenId]][balanceOf(_owners[_tokenId]) - 1] = 0;

        delete _ownedTokensIndex[_tokenId];

        delete allMysBox_[_tokenId];
        _balances[_msgSender()]--;
        _owners[_tokenId] = address(0);
        emit BurnMysteryBox(_msgSender(), _tokenId);
    }

    function getMysteryBox(uint256 _tokenId)
        public
        view
        returns (MysBox memory)
    {
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
