//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./GenerateSneakerBasisAttribute.sol";
import "./Constants.sol";
import "./IBEP20.sol";

interface IMove2Earn {
    function updateUserMaxEnergy(address _user) external;

    function getUserEnergy(address _user)
        external
        view
        returns (uint8 energy, uint8 maxEnergy);
}

interface IGem {
    struct Gem {
        uint256 id;
        uint8 level;
        address owner;
        Constants.Attributes attribute;
        uint16 baseAttribute;
        uint16 effectAttribute;
    }

    function getGem(uint256 _tokenId) external view returns (Gem memory);

    function getGemOwner(uint256 _tokenId) external view returns (address);
}

contract SneakerNFT is ERC721Enumerable, GenerateSneakerBasisAttribute, Ownable {
    using Constants for Constants.Quality;
    using Constants for Constants.SneakerType;
    using Constants for Constants.Attributes;
    using SafeMath for uint256;

    IBEP20  _GSTToken;
    IBEP20  _GMTToken;
    IGem  _gem;
    IMove2Earn  _move2Earn;
    uint256 idCounter;

    uint8 private decimal = 10;

    constructor(address _iRandom)
        ERC721("SNEAKER", "SNK")
        GenerateSneakerBasisAttribute(_iRandom)
    {}

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
        uint256[] mintFrom;
        bool isEarningGMT;
        uint256 coolingTime;
        uint256[] sockets;
    }

    struct QualityNType {
        Constants.Quality quality;
        Constants.SneakerType sneakerType;
    }

    mapping(uint256 => Sneaker) allSneakers_;
    mapping(address => bool) authorities_;

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
    event TransferSneaker(address _from, address _to, uint256 tokenId);

    function initialize(
        address _gstToken,
        address _gmtToken,
        address _igem,
        address _iShoeBox,
        address _iMove2Earn
    ) external onlyOwner {
        require(
            _gstToken != address(0) &&
                _gmtToken != address(0) &&
                _igem != address(0),
            "address 0x is not valid"
        );
        _GSTToken = IBEP20(_gstToken);
        _GMTToken = IBEP20(_gmtToken);
        _gem = IGem(_igem);
        _move2Earn = IMove2Earn(_iMove2Earn);
        authorities_[_igem] = true;
        authorities_[_iShoeBox] = true;
        authorities_[_iMove2Earn] = true;
    }

    function mint(
        address _sender,
        Constants.Quality _quality,
        Constants.SneakerType _type,
        uint256[] memory mintFrom
    ) external {
        require(
            _msgSender() == owner() || authorities_[_msgSender()],
            "SneakerNFT: Unauthorized to mint Sneakers"
        );
        (
            uint16 efficiency,
            uint16 luck,
            uint16 comfort,
            uint16 resilience
        ) = generateStats(_quality);

        SneakerAttributes memory attributes = SneakerAttributes(
            uint256(efficiency) * 10**decimal,
            uint256(luck) * 10**decimal,
            uint256(comfort) * 10**decimal,
            uint256(resilience) * 10**decimal
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
            mintFrom,
            false,
            0,
            new uint256[](4)
        );

        allSneakers_[idCounter] = sneaker;
        _safeMint(_sender, idCounter);
        emit MintSneaker(idCounter, _sender, sneaker);

        _move2Earn.updateUserMaxEnergy(_sender);
        idCounter++;
    }

    function transferSneaker(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        Sneaker storage sneaker = allSneakers_[_tokenId];
        transferFrom(_from, _to, _tokenId);
        emit TransferSneaker(_from, _to, _tokenId);
        sneaker.owner = _to;
        allSneakers_[_tokenId] = sneaker;
    }

    function userReward (address _user, uint256 _GSTTokenAmount, uint256 _GMTTokenAmount) external {
        require(
            _msgSender() == owner() || authorities_[_msgSender()],
            "SneakerNFT: Unauthorized to mint Sneakers"
        );
        if(_GSTTokenAmount > 0) {
            _GSTToken.transfer(_user, _GSTTokenAmount);
        }
        if(_GMTTokenAmount > 0) {
            _GMTToken.transfer(_user, _GMTTokenAmount);
        }
    }

    function getSneaker(uint256 _tokenId)
        external
        view
        returns (Sneaker memory sneaker)
    {
        sneaker = allSneakers_[_tokenId];
    }

    function getOwnerOfSneaker(uint256 _tokenId)
        external
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
        if(allSneakers_[_tokenId].level == Constants.MAX_LEVEL) {
            allSneakers_[_tokenId].isEarningGMT = true;
        }
        emit Leveling(_tokenId, _msgSender(), allSneakers_[_tokenId].level);
    }

    function updateMintCount(uint256 _tokenId) external {
        require(
            _msgSender() == owner() || authorities_[_msgSender()],
            "SneakerNFT: Unauthorized to update mint count"
        );
        require(
            allSneakers_[_tokenId].mintCount < Constants.MAX_MINT_COUNT,
            "SneakerNFT: Max mint count reached"
        );
        allSneakers_[_tokenId].mintCount++;
    }

    function decaySneaker(
        uint256 _tokenId,
        uint8 _durabilityDecay,
        uint8 hpDecay
    ) external  {
        require(
            _msgSender() == owner() || authorities_[_msgSender()],
            "SneakerNFT: Unauthorized to decay Sneaker"
        );
        
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
        require(
            _gem.getGemOwner(_gemId) == _msgSender(),
            "SneakerNFT: You don't own this gem"
        );

        Sneaker storage sneaker = allSneakers_[_tokenId];
        if (_socketSlot == 0) {
            require(
                sneaker.level >= 5,
                "SneakerNFT: Sneaker must be level 5 to use socket 1"
            );
        }
        if (_socketSlot == 1) {
            require(
                sneaker.level >= 10,
                "SneakerNFT: Sneaker must be level 10 to use socket 2"
            );
        }
        if (_socketSlot == 2) {
            require(
                sneaker.level >= 15,
                "SneakerNFT: Sneaker must be level 15 to use socket 3"
            );
        }
        if (_socketSlot == 3) {
            require(
                sneaker.level >= 20,
                "SneakerNFT: Sneaker must be level 20 to use socket 4"
            );
        }

        _GSTToken.transferFrom(
            _msgSender(),
            address(this),
            Constants.EQUIP_GEM_PRICE
        );
        //remove the extra attribute from old gem
        if (sneaker.sockets[_socketSlot] != 0) {
            require(
                sneaker.sockets[_socketSlot] != _gemId,
                "SneakerNFT: Gem is already equipped"
            );
            Constants.Attributes oldAttribute = _gem
                .getGem(sneaker.sockets[_socketSlot])
                .attribute;
            uint256 extraEffect = _gem
                .getGem(sneaker.sockets[_socketSlot])
                .effectAttribute;
            uint256 extraAttribute = _gem
                .getGem(sneaker.sockets[_socketSlot])
                .baseAttribute;
            if (oldAttribute == Constants.Attributes.Efficiency) {
                sneaker.attributes.efficiency -= extraAttribute * 10**decimal;
            }
            if (oldAttribute == Constants.Attributes.Resilience) {
                sneaker.attributes.resilience -= extraAttribute * 10**decimal;
            }
            if (oldAttribute == Constants.Attributes.Luck) {
                sneaker.attributes.luck -= extraAttribute * 10**decimal;
            }
            if (oldAttribute == Constants.Attributes.Comfort) {
                sneaker.attributes.comfort -= extraAttribute * 10**decimal;
            }

            sneaker.attributes.efficiency =
                (sneaker.attributes.efficiency * 100) /
                (100 + extraEffect);
            sneaker.attributes.resilience =
                (sneaker.attributes.resilience * 100) /
                (100 + extraEffect);
            sneaker.attributes.luck =
                (sneaker.attributes.luck * 100) /
                (100 + extraEffect);
            sneaker.attributes.comfort =
                (sneaker.attributes.comfort * 100) /
                (100 + extraEffect);
        }

        //add the new attribute to new gem
        Constants.Attributes attributeType = _gem.getGem(_gemId).attribute;
        uint256 newEffect = _gem.getGem(_gemId).effectAttribute;
        uint256 newAttribute = _gem.getGem(_gemId).baseAttribute;

        sneaker.attributes.efficiency =
            (sneaker.attributes.efficiency * (100 + newEffect)) /
            100;
        sneaker.attributes.resilience =
            (sneaker.attributes.resilience * (100 + newEffect)) /
            100;
        sneaker.attributes.luck =
            (sneaker.attributes.luck * (100 + newEffect)) /
            100;
        sneaker.attributes.comfort =
            (sneaker.attributes.comfort * (100 + newEffect)) /
            100;

        if (attributeType == Constants.Attributes.Efficiency) {
            sneaker.attributes.efficiency += newAttribute * 10**decimal;
        }
        if (attributeType == Constants.Attributes.Resilience) {
            sneaker.attributes.resilience += newAttribute * 10**decimal;
        }
        if (attributeType == Constants.Attributes.Luck) {
            sneaker.attributes.luck += newAttribute * 10**decimal;
        }
        if (attributeType == Constants.Attributes.Comfort) {
            sneaker.attributes.comfort += newAttribute * 10**decimal;
        }

        sneaker.sockets[_socketSlot] = _gemId;
    }

    function getQualityNType(uint256 _tokenId)
        external
        view
        returns (QualityNType memory result)
    {
        result = QualityNType(
            allSneakers_[_tokenId].quality,
            allSneakers_[_tokenId].sneakerType
        );
    }

    function updateDecimal(uint8 _decimal) private {
        decimal = _decimal;
    }

    function getDecimal() public view returns (uint8) {
        return decimal;
    }

    function getIdCounter() public view returns (uint256) {
        return idCounter;
    }
}
