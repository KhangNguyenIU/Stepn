
const settings ={
    quality:{
        Common:0,
        Uncommon: 1,
        Rare:2,
        Epic: 3,
        Legendary:4
    },
    initialAttributes:{
        Common:{
            min: 1,max: 10
        },
        Uncommon:{
            min:8, max: 18
        },
        Rare:{
            min: 15, max: 35
        },
        Epic: {
            min: 28, max: 63
        },
        Legendary:{
            min:50, max: 112
        }
    },
    newSneaker:{
        one:{
            id:'0',
            durability: '100',
            hp: '100',
            speed:{
                min:'1',
                max: '20'
            },
            attributes:{
                min:50,
                max: 112
            },
            level:'1',
            quality: '4',
            type:'3',
            mintCount: '0',
            mintFrom: 2,
            isEarningGMT: false,
            levelingPrice: '1000000000000000000'
        }
    }
}


module.exports ={
    settings
}