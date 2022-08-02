// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./Constants.sol";

interface IRandom {
    function getRandomNumber(uint16 _min, uint16 _max)
        external
        returns (uint256);
}

contract GenerateSneakerBasisAttribute {
    // using Constants for Constants.Quality;
    // using Constants for Constants.SneakerType;

    IRandom iRandom;

    event GenerateStats(
        uint16 efficiency,
        uint16 luck,
        uint16 comfort,
        uint16 resilience
    );

    event GenerateSpeed(uint8 _minSpeed, uint8 _maxSpeed);

    constructor(address _address) {
        iRandom = IRandom(_address);
    }

    function setIRandom(address _iRandom) public {
        iRandom = IRandom(_iRandom);
    }

    function generateStats(Constants.Quality _quality)
        internal
        returns (
            uint16 efficiency,
            uint16 luck,
            uint16 comfort,
            uint16 resilience
        )
    {
        (efficiency, luck, comfort, resilience) = _generateStat(_quality);
        emit GenerateStats(efficiency, luck, comfort, resilience);
    }

    function getSpeedFromType(Constants.SneakerType _type)
        internal
        returns (uint8 _minSpeed, uint8 _maxSpeed)
    {
        (_minSpeed, _maxSpeed)=_getSpeedFromType(_type);
        emit GenerateSpeed(_minSpeed, _maxSpeed);
    }

    // PRIVATE FUNCTIONS

    function _generateStat(Constants.Quality _quality)
        private
        returns (
            uint16 efficiency,
            uint16 luck,
            uint16 comfort,
            uint16 resilience
        )
    {
        (uint8 min, uint8 max) = _getMinMaxAttributeFromQuality(_quality);
        efficiency = uint16(iRandom.getRandomNumber(min, max));
        luck = uint16(iRandom.getRandomNumber(min, max));
        comfort = uint16(iRandom.getRandomNumber(min, max));
        resilience = uint16(iRandom.getRandomNumber(min, max));
    }

    function _getMinMaxAttributeFromQuality(Constants.Quality _quality)
        private
        pure
        returns (uint8 _minAtt, uint8 _maxAtt)
    {
        if (_quality == Constants.Quality.Common) {
            return (1, 10);
        } else if (_quality == Constants.Quality.Uncommon) {
            return (8, 18);
        } else if (_quality == Constants.Quality.Rare) {
            return (15, 35);
        } else if (_quality == Constants.Quality.Epic) {
            return (28, 63);
        } else if (_quality == Constants.Quality.Legendary) {
            return (50, 112);
        }
    }

    // extra attributes gain after leveling up
    function _getExtraAttributeFromQuality(Constants.Quality _quality)
        external
        pure
        returns (uint8 _extraAttribute)
    {
        if (_quality == Constants.Quality.Common) {
            return 4;
        } else if (_quality == Constants.Quality.Uncommon) {
            return 6;
        } else if (_quality == Constants.Quality.Rare) {
            return 8;
        } else if (_quality == Constants.Quality.Epic) {
            return 10;
        } else if (_quality == Constants.Quality.Legendary) {
            return 12;
        }
    }

    function _getSpeedFromType(Constants.SneakerType _type)
        private
        pure
        returns (uint8 _minSpeed, uint8 _maxSpeed)
    {
        if (_type == Constants.SneakerType.Walker) {
            return (1, 6);
        } else if (_type == Constants.SneakerType.Jogger) {
            return (4, 10);
        } else if (_type == Constants.SneakerType.Runner) {
            return (8, 10);
        } else if (_type == Constants.SneakerType.Trainer) {
            return (1, 20);
        }
    }
}
