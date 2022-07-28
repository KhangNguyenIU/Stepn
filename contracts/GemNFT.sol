//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IBEP20.sol";
import "hardhat/console.sol";
import "./Constants.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

contract GemNFT is ERC721, Ownable {
    using Constants for Constants.Attributes;

    IBEP20 private _GSTToken;
    IBEP20 private _GMTToken;
    IRandom iRandom;
    uint256 idCounter;

    struct Gem {
        uint256 id;
        uint8 level;
        address owner;
        Constants.Attributes attribute;
        uint16 baseAttribute;
        uint16 effectAttribute;
    }

    mapping(uint256 => Gem) allGems_;
    mapping(address => bool) approveMint_;

    constructor(
        address _iRandom,
        address _gstToken,
        address _gmtToken
    ) ERC721("Gem", "GEM") {
        idCounter = 1;
        require(_iRandom != address(0), "iRandom address is not valid");
        require(_gstToken != address(0), "GSTToken address is not valid");
        require(_gmtToken != address(0), "GMTToken address is not valid");
        iRandom = IRandom(_iRandom);
        _GSTToken = IBEP20(_gstToken);
        _GMTToken = IBEP20(_gmtToken);
    }

    // EVENTS
    event MintGem(address indexed _owner, uint256 indexed _id, Gem gem);
    event BurnGem(address owner, uint256 tokenId, uint256 time);
    event TransferGem(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    // MODIFIER
    modifier onlyGemOwner(uint256 _tokenId) {
        require(
            ownerOf(_tokenId) == msg.sender,
            "Only gem owner can call this function"
        );
        _;
    }

    // FUNCTIONS

    function setApproveMint(address _to, bool _approve) external {
        require(_to != address(0), "address is not valid");
        approveMint_[_to] = _approve;
    }
    
    function mint(address _to, uint8 _level) external {
        require(
            _msgSender() == owner() || approveMint_[_msgSender()],
            "Unauthorized to mint"
        );

        (uint16 base, uint16 effect) = _generateGemStats(_level);
        Gem memory gem = Gem(
            idCounter,
            _level,
            _to,
            _randomType(),
            base,
            effect
        );
        allGems_[idCounter] = gem;
        _safeMint(_to, idCounter);
        emit MintGem(_to, idCounter, gem);
        idCounter++;
    }

    function transferGem(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        transferFrom(_from, _to, _tokenId);
        emit TransferGem(_from, _to, _tokenId);
        allGems_[_tokenId].owner = _to;
    }

    function burn(uint256 _tokenId) public onlyGemOwner(_tokenId) {
        _burn(_tokenId);
        delete allGems_[_tokenId];
        emit BurnGem(msg.sender, _tokenId, block.timestamp);
    }

    function combineGem(
        uint256 _tokenId1,
        uint256 _tokenId2,
        uint256 _tokenId3
    )
        external
        onlyGemOwner(_tokenId1)
        onlyGemOwner(_tokenId2)
        onlyGemOwner(_tokenId3)
    {
        Gem memory gem1 = allGems_[_tokenId1];
        Gem memory gem2 = allGems_[_tokenId2];
        Gem memory gem3 = allGems_[_tokenId3];

        // 3 gem must be the same level
        require(
            (gem1.level == gem2.level) && (gem2.level == gem3.level),
            "3 gem must be the same level"
        );

        // 3 gem must be the same type
        require(
            gem1.attribute == gem2.attribute &&
                gem2.attribute == gem3.attribute,
            "3 gem must be the same type"
        );

        // gem level must be less that  max level
        require(gem1.level < Constants.MAX_LEVEL, "Gem level is maximum");

        _GSTToken.transferFrom(
            _msgSender(),
            address(this),
            Constants.COMBINE_PRICE
        );

        (uint16 base, uint16 effect) = _generateGemStats(gem1.level + 1);
        Gem memory gem = Gem(
            idCounter,
            gem1.level + 1,
            msg.sender,
            gem1.attribute,
            base,
            effect
        );

        _safeMint(msg.sender, idCounter);
        allGems_[idCounter] = gem;
        emit MintGem(msg.sender, idCounter, gem);
        idCounter++;
        burn(_tokenId1);
        burn(_tokenId2);
        burn(_tokenId3);
    }

    function getGem(uint256 _tokenId) public view returns (Gem memory) {
        return allGems_[_tokenId];
    }

    function getGemOwner(uint256 _tokenId) external view returns (address) {
        return ownerOf(_tokenId);
    }

    function _randomType() private returns (Constants.Attributes) {
        uint256 random = iRandom.getRandomNumber(0, 3);
        if (random == 0) return Constants.Attributes.Efficiency;
        else if (random == 1) return Constants.Attributes.Luck;
        else if (random == 2) return Constants.Attributes.Comfort;
        else return Constants.Attributes.Resilience;
    }

    function _generateGemStats(uint8 _level)
        private
        pure
        returns (uint16 base, uint16 effect)
    {
        require(_level <= Constants.MAX_LEVEL, "GemNFT: max level");
        uint8 _base = 2;
        uint8 _effect = 5;

        for (uint8 i = 1; i <= _level; i++) {
            base += _base * i + i;
            effect += _effect * i + i;
        }
    }

    function getIdCounter() public view returns (uint256) {
        return idCounter;
    }
}
