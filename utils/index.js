const { BigNumber } = require('bignumber.js')

exports.Bignumber2String = (bigNumber) => {
    return  BigNumber(bigNumber.toString()).toString()
}