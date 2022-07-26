//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./Authority.sol";
import "./GenerateSneakerBasisAttribute.sol";
import "./Constants.sol";
import "./IBEP20.sol";
import "hardhat/console.sol";

contract SneakerNFT is ERC721, Authority, GenerateSneakerBasisAttribute {
    using Constants for Constants.Quality;
    using Constants for Constants.SneakerType;

    using SafeMath for uint256;

    IBEP20 internal _GSTToken;
    IBEP20 internal _GMTToken;

    uint256 idCounter;

    uint8 private decimal =10;
    constructor(
        address _iRandom,
        address _gstToken,
        address _gmtToken
    ) ERC721("SNEAKER", "SNK") GenerateSneakerBasisAttribute(_iRandom) {
        require(_gstToken != address(0), "GSTToken address is not valid");
        require(_gmtToken != address(0), "GMTToken address is not valid");
        require(_iRandom != address(0), "iRandom address is not valid");
        _GSTToken = IBEP20(_gstToken);
        _GMTToken = IBEP20(_gmtToken);
        editAuthority(_msgSender(), true);
    }

    struct SneakerAttributes {
        uint256 efficiency;
        uint256 luck;
        uint256 comfort;
        uint256 resilience;
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
        uint256 coolingTime;
        uint256[] sockets;
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
    event SneakerDecay(uint256 tokenId, uint8 durabilityDecay, uint8 hpDecay);
    event RepairSneaker(address _owner, uint256 tokenId, uint256 cost);

    function mint(
        address _sender,
        Constants.Quality _quality,
        Constants.SneakerType _type
    ) external checkAuthority {
        (
            uint16 efficiency,
            uint16 luck,
            uint16 comfort,
            uint16 resilience
        ) = generateStats(_quality);

        SneakerAttributes memory attributes = SneakerAttributes(
            uint256(efficiency)*10**decimal,
            uint256(luck)*10**decimal,
            uint256(comfort)*10**decimal,
            uint256(resilience)*10**decimal
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
            false,
            0,
            new uint256[](4)
        );

        allSneakers_[idCounter] = sneaker;
        _safeMint(_sender, idCounter);
        emit MintSneaker(idCounter, _sender, sneaker);
        idCounter++;
    }

    function transferSneaker(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        Sneaker storage sneaker = allSneakers_[_tokenId];
        transferFrom(_from, _to, _tokenId);
        sneaker.owner = _to;
        allSneakers_[_tokenId] = sneaker;
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

    function setIsEarningGMT(uint256 _tokenId, bool _isEarningGMT)
        external
        onlySneakerOwner(_tokenId)
    {
        Sneaker storage sneaker = allSneakers_[_tokenId];
        require(sneaker.level == 30, "SneakerNFT: Sneaker must be level 30");
        sneaker.isEarningGMT = _isEarningGMT;
        allSneakers_[_tokenId] = sneaker;
    }

    function levelingSneaker(uint256 _tokenId)
        external
        onlySneakerOwner(_tokenId)
    {
        require(
            allSneakers_[_tokenId].level < Constants.MAX_LEVEL,
            "SneakerNFT: Max level reached"
        );

        _GSTToken.transferFrom(
            _msgSender(),
            address(this),
            Constants.LEVELING_PRICE
        );
        allSneakers_[_tokenId].level++;
        emit Leveling(_tokenId, _msgSender(), allSneakers_[_tokenId].level);
    }

    function decaySneaker(
        uint256 _tokenId,
        uint8 _durabilityDecay,
        uint8 hpDecay
    ) external checkAuthority {
        require(
            allSneakers_[_tokenId].durability > _durabilityDecay,
            "SneakerNFT: Durability is too low"
        );
        require(
            allSneakers_[_tokenId].hp > hpDecay,
            "SneakerNFT: HP is too low"
        );
        allSneakers_[_tokenId].durability -= _durabilityDecay;
        allSneakers_[_tokenId].hp -= hpDecay;
        emit SneakerDecay(_tokenId, _durabilityDecay, hpDecay);
    }

    function repairSneaker(uint256 _tokenId)
        external
        onlySneakerOwner(_tokenId)
    {
        uint256 repairPrice = (Constants.MAX_DURABILITY -
            allSneakers_[_tokenId].durability) *
            Constants.REPAIR_PRICE +
            (Constants.MAX_HP - allSneakers_[_tokenId].hp) *
            Constants.REPAIR_PRICE;
        _GSTToken.transferFrom(_msgSender(), address(this), repairPrice);

        allSneakers_[_tokenId].durability = 100;
        allSneakers_[_tokenId].hp = 100;
        emit RepairSneaker(_msgSender(), _tokenId, repairPrice);
    }

    function equipGem(
        uint256 _tokenId,
        uint256 _gemId,
        uint8 _socketSlot
    ) external onlySneakerOwner(_tokenId) {
        Sneaker storage sneaker = allSneakers_[_tokenId];
        if(_socketSlot == 0){
            require(sneaker.level == 5, "SneakerNFT: Sneaker must be level 5 to use socket 1");
        }
        if(_socketSlot ==1){
            require(sneaker.level == 10, "SneakerNFT: Sneaker must be level 10 to use socket 2");
        }
        if(_socketSlot ==2){
            require(sneaker.level == 15, "SneakerNFT: Sneaker must be level 15 to use socket 3");
        }
        if(_socketSlot ==3){
            require(sneaker.level == 20, "SneakerNFT: Sneaker must be level 20 to use socket 4");
        }

        sneaker.sockets[_socketSlot] = _gemId;
    }

    function updateDecimal(uint8 _decimal) private {
        decimal = _decimal;
    }

    function getDecimal() public view returns (uint8) {
        return decimal;
    }

}
