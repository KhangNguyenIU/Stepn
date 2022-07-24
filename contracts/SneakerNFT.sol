//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GenerateSneakerBasisAttribute.sol";
import "./Constants.sol";
import "./IBEP20.sol";
import "hardhat/console.sol";

contract SneakerNFT is ERC721, Ownable, GenerateSneakerBasisAttribute {
    using Constants for Constants.Quality;
    using Constants for Constants.SneakerType;

    IBEP20 internal _GSTToken;
    IBEP20 internal _GMTToken;

    uint256 idCounter;

    constructor(address _iRandom, address _gstToken , address _gmtToken)
        ERC721("SNEAKER", "SNK")
        GenerateSneakerBasisAttribute(_iRandom)
    {
        require(_gstToken != address(0), "GSTToken address is not valid");
        require(_gmtToken != address(0), "GMTToken address is not valid");
        require(_iRandom != address(0), "iRandom address is not valid");
        _GSTToken = IBEP20(_gstToken);
        _GMTToken = IBEP20(_gmtToken);

    }

    struct SneakerAttributes {
        uint16 efficiency;
        uint16 luck;
        uint16 comfort;
        uint16 resilience;
    }

    struct Sneaker {
        uint256 id;
        uint16 durability;
        uint16 hp;
        uint8[2] speed;
        SneakerAttributes attributes;
        address owner;
        uint8 level;
        Constants.Quality quality;
        Constants.SneakerType sneakerType;
        uint8 mintCount;
        uint8[] mintFrom;
        bool isEarningGMT;
    }

    mapping(uint256 => Sneaker) allSneakers_;

    //MODIFIER
    modifier onlySneakerOwner(uint256 tokenId) {
        require(
            _msgSender() == ownerOf(tokenId),
            "SneakerNFT: Only Owner of this Sneaker can perform this action"
        );
        _;
    }

    // EVENTS
    event MintSneaker(uint256 tokenId, address _owner, Sneaker sneaker);

    event BurnSneaker(uint256 tokenId, address _owner, uint256 time);
    event Leveling(uint256 tokenId, address _owner, uint8 level);

    function mint(
        address _sender,
        Constants.Quality _quality,
        Constants.SneakerType _type
    ) external onlyOwner {
        (
            uint16 efficiency,
            uint16 luck,
            uint16 comfort,
            uint16 resilience
        ) = generateStats(_quality);

        SneakerAttributes memory attributes = SneakerAttributes(
            efficiency,
            luck,
            comfort,
            resilience
        );

        (uint8 minSpeed, uint8 maxSpeed) = getSpeedFromType(_type);

        Sneaker memory sneaker = Sneaker(
            idCounter,
            100,
            100,
            [minSpeed, maxSpeed],
            attributes,
            _sender,
            1,
            _quality,
            _type,
            0,
            new uint8[](2),
            false
        );

        allSneakers_[idCounter] = sneaker;
        _safeMint(_sender, idCounter);
        emit MintSneaker(idCounter, _sender, sneaker);
        idCounter++;
    }

    function getSneaker(uint256 _tokenId)
        public
        view
        returns (Sneaker memory sneaker)
    {
        sneaker = allSneakers_[_tokenId];
    }

    function getOwnerOfSneaker(uint256 _tokenId)
        public
        view
        returns (address owner)
    {
        owner = ownerOf(_tokenId);
    }

    function getAttributesOfSneaker(uint256 _tokenId)
        public
        view
        returns (SneakerAttributes memory attributes)
    {
        attributes = allSneakers_[_tokenId].attributes;
    }

    function burnSneaker(uint256 _tokenId) external onlySneakerOwner(_tokenId) {
        _burn(_tokenId);
        delete allSneakers_[_tokenId];

        emit BurnSneaker(_tokenId, _msgSender(), block.timestamp);
    }

    function levelingSneaker(uint256 _tokenId) external onlySneakerOwner(_tokenId){
        require(allSneakers_[_tokenId].level < Constants.MAX_LEVEL, "SneakerNFT: Max level reached");

        _GSTToken.transferFrom(_msgSender(), address(this), Constants.LEVELING_PRICE);
        allSneakers_[_tokenId].level++;
        emit Leveling(_tokenId, _msgSender(), allSneakers_[_tokenId].level);
    }
}
