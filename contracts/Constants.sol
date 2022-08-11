//SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

library Constants {
    enum Quality {
        Common,
        Uncommon,
        Rare,
        Epic,
        Legendary
    }
    enum SneakerType {
        Walker,
        Jogger,
        Runner,
        Trainer
    }

    enum Attributes {
        Efficiency,
        Luck,
        Comfort,
        Resilience
    }

    uint8 constant MAX_LEVEL = 30;
    uint8 constant MAX_LEVEL_GEM= 10;
    uint8 constant MAX_HP = 100;
    uint8 constant MAX_DURABILITY = 100;

    uint256 constant LEVELING_PRICE = 1000000000000000000;

    uint256 constant REPAIR_PRICE = 10000000000000000;
    uint256 constant COMBINE_PRICE = 1000000000000000000;
    uint256 constant EQUIP_GEM_PRICE = 1000000000000000000;

    uint256 constant MAX_MINT_COUNT = 7;

    uint256 constant MAX_ENERGY =20;
}
