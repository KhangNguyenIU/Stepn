//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./Constants.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

interface IMintingScrollNFT {
    function burnScroll(uint256 _tokenId) external;

    function getOnwerOfScroll(uint256 _tokenId) external view returns (address);

    function getQualityOfScroll(uint256 _tokenId)
        external
        view
        returns (Constants.Quality);
}

interface ISneaker {
    struct QualityNType {
        Constants.Quality quality;
        Constants.SneakerType sneakerType;
    }

    function mint(
        address _sender,
        Constants.Quality _quality,
        Constants.SneakerType _type,
        uint256[] memory mintFrom
    ) external;

    function updateMintCount(uint256 _tokenId) external;

    function getQualityNType(uint256 _tokenId)
        external
        view
        returns (QualityNType memory result);

    function getOwnerOfSneaker(uint256 _tokenId)
        external
        view
        returns (address owner);
}

contract ShoeBoxNFT is ERC721, Ownable {
    using Constants for Constants.Quality;
    using Constants for Constants.SneakerType;

    IRandom iRandom;
    ISneaker iSneaker;
    IMintingScrollNFT iMintingScroll;

    uint256 idCounter;

    struct ShoeBox {
        uint256 id;
        address owner;
        uint256 parentSneaker1;
        uint256 parentSneaker2;
        Constants.Quality quality;
        Constants.SneakerType sneakerType;
    }

    mapping(uint256 => ShoeBox) allShoeBox_;
    mapping(Constants.Quality => mapping(Constants.Quality => uint8[])) combinationProbability_;
    mapping(Constants.Quality => uint8[]) qualityProbability_;
    mapping(Constants.SneakerType => mapping(Constants.SneakerType => uint8[])) typeProbability_;

    constructor(
        address _iRandom,
        address _iSneaker,
        address _iMintingScroll
    ) ERC721("Shoe Box", "SBX") {
        idCounter = 1;
        require(_iRandom != address(0), "iRandom address is not valid");
        iRandom = IRandom(_iRandom);
        iSneaker = ISneaker(_iSneaker);
        iMintingScroll = IMintingScrollNFT(_iMintingScroll);
        _setCombinationProbabilities();
        _setQualityProbabilities();
        _setTypeProbabilities();
    }

    event MintShoeBox(
        address indexed _to,
        uint256 _id,
        Constants.Quality _quality
    );
    event TransferShoeBox(
        address indexed from,
        address indexed to,
        uint256 indexed tokenId
    );

    event OpenShoeBox(address owner, uint256 id);

    function mint(
        uint256 _sneakerId1,
        uint256 _sneakerId2,
        uint256 _mintingScrollId1,
        uint256 _mintingScrollId2
    ) external {
        require(
            _sneakerId1 != _sneakerId2,
            "ShoeBoxNFT: cannot mint 2 same sneakers"
        );

        require(
            _mintingScrollId1 != _mintingScrollId2,
            "ShoeBoxNFT: cannot mint 2 same minting scrolls"
        );

        // require user own 2 sneakers
        require(
            iSneaker.getOwnerOfSneaker(_sneakerId1) == msg.sender &&
                iSneaker.getOwnerOfSneaker(_sneakerId2) == msg.sender,
            "ShoeBoxNFT: Only sneaker owner can mint ShoeBox"
        );

        //require user own 2 minting scrolls
        require(
            (iMintingScroll.getOnwerOfScroll(_mintingScrollId1) ==
                msg.sender) &&
                (iMintingScroll.getOnwerOfScroll(_mintingScrollId2) ==
                    msg.sender),
            "ShoeBoxNFT: Only minting scroll owner can mint ShoeBox.."
        );

        // get quality of 2 scroll
        Constants.Quality scroll1Quality = iMintingScroll.getQualityOfScroll(
            _mintingScrollId1
        );
        Constants.Quality scroll2Quality = iMintingScroll.getQualityOfScroll(
            _mintingScrollId2
        );

        // get Quality and Type of 2 sneakers
        ISneaker.QualityNType memory qualityAValue1 = iSneaker.getQualityNType(
            _sneakerId1
        );
        ISneaker.QualityNType memory qualityAValue2 = iSneaker.getQualityNType(
            _sneakerId2
        );

        // require 2 minting scrolls have same quality with the sneakers
        require(
            (scroll1Quality == qualityAValue1.quality ||
                scroll1Quality == qualityAValue2.quality) &&
                (scroll2Quality == qualityAValue1.quality ||
                    scroll2Quality == qualityAValue2.quality),
            "ShoeBoxNFT: 2 minting scrolls have different quality with the sneakers"
        );

        //get random quality and type of new sneaker
        Constants.Quality randomQuality = _getRandomQualityFromCombineProbability(
                combinationProbability_[qualityAValue1.quality][
                    qualityAValue2.quality
                ]
            );

        Constants.SneakerType randomType = _getRandomTypeFromTypeProbabilitites(
            typeProbability_[qualityAValue1.sneakerType][
                qualityAValue1.sneakerType
            ]
        );

        ShoeBox memory shoeBox = ShoeBox(
            idCounter,
            _msgSender(),
            _sneakerId1,
            _sneakerId2,
            randomQuality,
            randomType
        );

        _safeMint(_msgSender(), idCounter);
        allShoeBox_[idCounter] = shoeBox;

        //update mints count of 2 sneakers
        iSneaker.updateMintCount(_sneakerId1);
        iSneaker.updateMintCount(_sneakerId2);

        emit MintShoeBox(_msgSender(), idCounter, randomQuality);
        idCounter++;
    }

    function open(uint256 _tokenId) external {
        require(
            _msgSender() == ownerOf(_tokenId),
            "ShoeBoxNFT: Only owner can open"
        );

        ShoeBox memory shoeBox = allShoeBox_[_tokenId];
        uint256[] memory mintFrom = new uint256[](2);
        mintFrom[0] = shoeBox.parentSneaker1;
        mintFrom[1] = shoeBox.parentSneaker2;

        iSneaker.mint(
            _msgSender(),
            shoeBox.quality,
            shoeBox.sneakerType,
            mintFrom
        );
        //burn
        _burn(_tokenId);
        delete allShoeBox_[_tokenId];
    }

    function transferShoeBox(
        address _from,
        address _to,
        uint256 _tokenId
    ) external {
        allShoeBox_[_tokenId].owner = _to;
        transferFrom(_from, _to, _tokenId);
        emit TransferShoeBox(_from, _to, _tokenId);
    }

    function burn(uint256 _tokenId) external {
        require(
            _msgSender() == ownerOf(_tokenId),
            "ShoeBoxNFT: Only owner can burn"
        );
        _burn(_tokenId);
        delete allShoeBox_[_tokenId];
    }

    function getProbability(
        Constants.Quality _quality1,
        Constants.Quality _quality2
    ) external view returns (uint8[] memory) {
        return combinationProbability_[_quality1][_quality2];
    }

    function getShoeBox(uint256 _tokenId)
        external
        view
        returns (ShoeBox memory)
    {
        return allShoeBox_[_tokenId];
    }

    function _setCombinationProbabilities() private {
        combinationProbability_[Constants.Quality.Common][
            Constants.Quality.Common
        ] = [100, 0, 0, 0, 0];
        combinationProbability_[Constants.Quality.Common][
            Constants.Quality.Uncommon
        ] = [50, 49, 1, 0, 0];
        combinationProbability_[Constants.Quality.Common][
            Constants.Quality.Rare
        ] = [50, 0, 49, 1, 0];
        combinationProbability_[Constants.Quality.Common][
            Constants.Quality.Epic
        ] = [50, 0, 0, 49, 1];
        combinationProbability_[Constants.Quality.Common][
            Constants.Quality.Legendary
        ] = [50, 0, 0, 0, 50];
        combinationProbability_[Constants.Quality.Uncommon][
            Constants.Quality.Uncommon
        ] = [0, 98, 2, 0, 0];
        combinationProbability_[Constants.Quality.Uncommon][
            Constants.Quality.Rare
        ] = [0, 49, 50, 1, 0];
        combinationProbability_[Constants.Quality.Uncommon][
            Constants.Quality.Epic
        ] = [0, 49, 1, 49, 0];
        combinationProbability_[Constants.Quality.Uncommon][
            Constants.Quality.Legendary
        ] = [0, 49, 1, 0, 50];
        combinationProbability_[Constants.Quality.Rare][
            Constants.Quality.Rare
        ] = [0, 0, 98, 2, 0];
        combinationProbability_[Constants.Quality.Rare][
            Constants.Quality.Epic
        ] = [0, 0, 49, 50, 1];
        combinationProbability_[Constants.Quality.Rare][
            Constants.Quality.Legendary
        ] = [0, 0, 49, 1, 50];
        combinationProbability_[Constants.Quality.Epic][
            Constants.Quality.Epic
        ] = [0, 0, 0, 98, 2];
        combinationProbability_[Constants.Quality.Epic][
            Constants.Quality.Legendary
        ] = [0, 0, 0, 49, 51];
        combinationProbability_[Constants.Quality.Legendary][
            Constants.Quality.Legendary
        ] = [0, 0, 0, 0, 100];
    }

    function _setQualityProbabilities() private {
        qualityProbability_[Constants.Quality.Common] = [97, 3, 0, 0, 0];
        qualityProbability_[Constants.Quality.Uncommon] = [25, 73, 2, 0, 0];
        qualityProbability_[Constants.Quality.Rare] = [0, 27, 71, 2, 0];
        qualityProbability_[Constants.Quality.Epic] = [0, 0, 30, 68, 2];
        qualityProbability_[Constants.Quality.Legendary] = [0, 0, 0, 35, 65];
    }

    function _setTypeProbabilities() private {
        typeProbability_[Constants.SneakerType.Walker][
            Constants.SneakerType.Walker
        ] = [85, 6, 6, 3];
        typeProbability_[Constants.SneakerType.Walker][
            Constants.SneakerType.Jogger
        ] = [45, 45, 7, 3];
        typeProbability_[Constants.SneakerType.Walker][
            Constants.SneakerType.Runner
        ] = [45, 7, 45, 3];
        typeProbability_[Constants.SneakerType.Walker][
            Constants.SneakerType.Trainer
        ] = [80, 6, 6, 8];
        typeProbability_[Constants.SneakerType.Jogger][
            Constants.SneakerType.Jogger
        ] = [6, 85, 6, 3];
        typeProbability_[Constants.SneakerType.Jogger][
            Constants.SneakerType.Runner
        ] = [7, 45, 45, 3];
        typeProbability_[Constants.SneakerType.Jogger][
            Constants.SneakerType.Trainer
        ] = [6, 80, 6, 8];
        typeProbability_[Constants.SneakerType.Runner][
            Constants.SneakerType.Runner
        ] = [6, 6, 85, 3];
        typeProbability_[Constants.SneakerType.Runner][
            Constants.SneakerType.Trainer
        ] = [6, 6, 80, 8];
        typeProbability_[Constants.SneakerType.Trainer][
            Constants.SneakerType.Trainer
        ] = [25, 25, 25, 25];
    }

    function _getRandomTypeFromTypeProbabilitites(uint8[] memory _probability)
        private
        returns (Constants.SneakerType)
    {
        uint8 randomType = uint8(iRandom.getRandomNumber(0, 100));
        if (randomType < _probability[0]) {
            return Constants.SneakerType.Walker;
        } else if (randomType < _probability[0] + _probability[1]) {
            return Constants.SneakerType.Jogger;
        } else if (
            randomType < _probability[0] + _probability[1] + _probability[2]
        ) {
            return Constants.SneakerType.Runner;
        } else {
            return Constants.SneakerType.Trainer;
        }
    }

    function _getRandomQualityFromQualityProbability(
        uint8[] memory _probability
    ) private returns (Constants.Quality) {
        uint8 randomQuality = uint8(iRandom.getRandomNumber(0, 100));
        uint16 qualityIndex = 0;
        while (randomQuality > _probability[qualityIndex]) {
            randomQuality -= _probability[qualityIndex];
            qualityIndex++;
        }
        return Constants.Quality(qualityIndex);
    }

    function _getRandomQualityFromCombineProbability(
        uint8[] memory _probability
    ) private returns (Constants.Quality) {
        uint8 randomQuality = uint8(iRandom.getRandomNumber(0, 100));
        if (randomQuality < _probability[0]) {
            return Constants.Quality.Common;
        } else if (randomQuality < _probability[0] + _probability[1]) {
            return Constants.Quality.Uncommon;
        } else if (
            randomQuality < _probability[0] + _probability[1] + _probability[2]
        ) {
            return Constants.Quality.Rare;
        } else if (
            randomQuality <
            _probability[0] +
                _probability[1] +
                _probability[2] +
                _probability[3]
        ) {
            return Constants.Quality.Epic;
        } else {
            return Constants.Quality.Legendary;
        }
    }
}
