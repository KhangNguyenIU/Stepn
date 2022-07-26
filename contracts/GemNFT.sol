//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Constants.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

contract GemNFT is ERC721, Ownable {
    using Constants for Constants.Attributes;

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

    constructor(address _iRandom) ERC721("Gem", "GEM") {
        idCounter = 1;
        iRandom = IRandom(_iRandom);
    }

    // EVENTS
    event Mint(address indexed _owner, uint256 indexed _id, Gem gem);

    // FUNCTIONS
    function mint(address _to, uint8  _level) external onlyOwner {
        (uint16 base, uint16 effect) = _generateGemStats(_level);
        Gem memory gem = Gem(idCounter, 1, _to, _randomType(),base, effect);
        allGems_[idCounter] = gem;
        _safeMint(_to, idCounter);
        emit Mint(_to, idCounter, gem);
        idCounter++;
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
}
