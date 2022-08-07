//SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "./Constants.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ISneakerNFT {
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

    function getSneaker(uint256 _tokenId)
        external
        view
        returns (Sneaker memory sneaker);

    function getOwnerOfSneaker(uint256 _tokenId)
        external
        view
        returns (address owner);

    function userReward(
        address _user,
        uint256 _GSTTokenAmount,
        uint256 _GMTTokenAmount
    ) external;

    function decaySneaker(
        uint256 _tokenId,
        uint8 _durabilityDecay,
        uint8 hpDecay
    ) external;
}

contract Move2Earn is Ownable {
    using Constants for Constants.Quality;
    using Constants for Constants.SneakerType;
    using Constants for Constants.Attributes;

    ISneakerNFT isneakerNFT;

    struct UserEnergy {
        uint8 energy;
        uint8 maxEnergy;
        address user;
    }

    mapping(address => UserEnergy) allUserEnergy_;

    constructor(address _isneakerNFTAddress) {
        isneakerNFT = ISneakerNFT(_isneakerNFTAddress);
    }

    //EVENT
    event Reward(
        address _user,
        uint256 GSTTokenAmount,
        uint256 GMTTokenAmount,
        uint256 time
    );

    function updateUserMaxEnergy(address _user) external {
        UserEnergy storage userEnergy = allUserEnergy_[_user];

        require(
            allUserEnergy_[_user].energy <= Constants.MAX_ENERGY,
            "Move2Earn: Max energy reached"
        );
        if (userEnergy.energy == 0) {
            userEnergy.energy = 2;
            userEnergy.maxEnergy = 2;
        } else {
            userEnergy.maxEnergy++;
            userEnergy.energy++;
        }
    }

    function getUserEnergy(address _user)
        external
        view
        returns (uint8 energy, uint8 maxEnergy)
    {
        return (allUserEnergy_[_user].energy, allUserEnergy_[_user].maxEnergy);
    }

    function refillUserEnergy(address _user) external onlyOwner{
        UserEnergy storage userEnergy = allUserEnergy_[_user];
        userEnergy.energy = userEnergy.maxEnergy;
    }

    function move2Earn(
        uint256 _tokenId,
        uint16 _avgSpeed,
        uint16 _duration,
        bool _gpsSignal
    ) external {
        require(
            _msgSender() == isneakerNFT.getOwnerOfSneaker(_tokenId),
            "Move2Earn: Only owner can use sneaker"
        );

        require(
            allUserEnergy_[_msgSender()].energy > 0,
            "Move2Earn: You don't have enough energy"
        );

        require(_gpsSignal, "Move2Earn: GPS signal is required");

        ISneakerNFT.Sneaker memory sneaker = isneakerNFT.getSneaker(_tokenId);

        require( sneaker.hp > 20 && sneaker.durability >20, "Move2Earn: Sneaker is too damaged");

        // speed coefficiency
        uint8 speedCoefficiency = 100;
        if (_avgSpeed > sneaker.speed[1] || _avgSpeed < sneaker.speed[0]) {
            speedCoefficiency = 50;
        }

        // energy used
        uint8 energyUsed = uint8(_duration / 5 + 1);
        if (energyUsed > allUserEnergy_[_msgSender()].energy) {
            energyUsed = allUserEnergy_[_msgSender()].energy;
        }

        // base reward by sneaker type
        uint8 baseReward = _rewardBySneakerType(sneaker.sneakerType);

        // hp coefficiency
        uint16 hpCoefficiency = _hpCoefficiency(sneaker.hp);

        // durability coefficiency
        uint16 durabilityCoefficiency = _durabilityCoefficiency(
            sneaker.durability
        );

        uint256 rewardAmount = ((baseReward *
            10**18 +
            sneaker.attributes.efficiency *
            10**7) *
            energyUsed *
            speedCoefficiency *
            hpCoefficiency *
            durabilityCoefficiency) / 10**6;
        if (sneaker.isEarningGMT) {
            isneakerNFT.userReward(
                _msgSender(),
                rewardAmount / 2,
                rewardAmount / 2
            );
            emit Reward(
                _msgSender(),
                rewardAmount / 2,
                rewardAmount / 2,
                block.timestamp
            );
        } else {
            isneakerNFT.userReward(_msgSender(), rewardAmount, 0);
            emit Reward(_msgSender(), rewardAmount, 0, block.timestamp);
        }
        isneakerNFT.decaySneaker(_tokenId, energyUsed, energyUsed);
        allUserEnergy_[_msgSender()].energy -= energyUsed;
    }

    function _rewardBySneakerType(Constants.SneakerType sneakerType)
        private
        pure
        returns (uint8 reward)
    {
        if (sneakerType == Constants.SneakerType.Walker) {
            return 4;
        }
        if (sneakerType == Constants.SneakerType.Jogger) {
            return 5;
        }
        if (sneakerType == Constants.SneakerType.Runner) {
            return 6;
        }
        return 7;
    }

    function _hpCoefficiency(uint16 _hp) private pure returns (uint16 coeff) {
        if (_hp >= 90) {
            return 100;
        } else if (_hp >= 50) {
            return 90;
        }
        return 10;
    }

    function _durabilityCoefficiency(uint16 _durability)
        private
        pure
        returns (uint16 coeff)
    {
        if (_durability >= 90) {
            return 100;
        } else if (_durability >= 50) {
            return 90;
        }
        return 10;
    }

    function _calculateRewardBySneakerType(
        Constants.SneakerType sneakerType,
        uint256 _efficiency,
        uint16 _hp,
        uint16 _durability
    ) private pure returns (uint256 reward) {
        uint8 baseReward = 0;
        if (sneakerType == Constants.SneakerType.Walker) {
            baseReward = 4;
        }
        if (sneakerType == Constants.SneakerType.Jogger) {
            baseReward = 5;
        }
        if (sneakerType == Constants.SneakerType.Runner) {
            baseReward = 6;
        }
        if (sneakerType == Constants.SneakerType.Trainer) {
            baseReward = 7;
        }

        uint8 hpCoefficiency;
        if (_hp >= 90) {
            hpCoefficiency = 100;
        } else if (_hp >= 50) {
            hpCoefficiency = 90;
        } else {
            hpCoefficiency = 10;
        }

        uint8 durabilityCoefficiency;
        if (_durability >= 90) {
            durabilityCoefficiency = 100;
        } else if (_durability >= 50) {
            durabilityCoefficiency = 90;
        } else {
            durabilityCoefficiency = 10;
        }

        reward =
            (((uint256(baseReward * 10**18) + _efficiency * 10**17) *
                hpCoefficiency *
                durabilityCoefficiency) / 10) *
            10**4;
    }
}
