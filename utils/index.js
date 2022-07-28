const { BigNumber } = require('bignumber.js')

exports.Bignumber2String = (bigNumber) => {
    return  BigNumber(bigNumber.toString()).toString()
}

exports.sleep = ms =>{
    return new Promise(resolve =>{
        setTimeout(resolve, ms)
    })
}