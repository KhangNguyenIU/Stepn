
const settings = {
    address0: "0x0000000000000000000000000000000000000000",
    decimal: 10 ** 10,
    quality: {
        Common: 0,
        Uncommon: 1,
        Rare: 2,
        Epic: 3,
        Legendary: 4
    },
    initialAttributes: {
        Common: {
            min: 1, max: 10
        },
        Uncommon: {
            min: 8, max: 18
        },
        Rare: {
            min: 15, max: 35
        },
        Epic: {
            min: 28, max: 63
        },
        Legendary: {
            min: 50, max: 112
        }
    },
    newSneaker: {
        one: {
            id: '0',
            durability: '100',
            hp: '100',
            speed: {
                min: '1',
                max: '20'
            },
            attributes: {
                min: 50,
                max: 112
            },
            level: '1',
            quality: '4',
            type: '3',
            mintCount: '0',
            mintFrom: 2,
            isEarningGMT: false,
            decimal: 10 ** 10,
            levelingPrice: '1000000000000000000'
        }
    },
    update: {
        decay: {
            durability: 4,
            hp: 5,
            exceedDurability: 100,
            exceedHP: 100,
            repairPrice: '90000000000000000'
        }
    },
    gem: {
        newGem: {
            id: '1',
            level: '1',
            attribute: [0, 1, 2, 3],
            baseAttribute: 3,
            effectAttribute: 6
        },
        combine: {
            needLv: 2,
            mintedLv: 3,
            price: '1000000000000000000'
        },
        equip: {
            price: '1000000000000000000'
        },
        leveling: {
            price: '1000000000000000000',
            priceToLv30: '30000000000000000000'
        }
    },
    mysteryBox: {
        new: {
            id: '1',
            coolDownTime: '30'
        }
    },
    shoeBox: {
        sneaker1: 0,
        sneaker2: 1,
        quality1: 1,
        quality2: 2,
        sneakerType1:1,
        sneakerType2:2,
        proba : [0,49,50,1,0],
        newSneaker:2,
        mintFrom: ['0', '1']
    }
}


module.exports = {
    settings
}