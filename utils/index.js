const { BigNumber } = require('bignumber.js')
const fs = require('fs')
const path = require('path')

exports.Bignumber2String = (bigNumber) => {
    return BigNumber(bigNumber.toString()).toString()
}

exports.sleep = ms => {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })
}

exports.writeAdressFile = (jsonData, writeDir) => {
    fs.writeFileSync(path.resolve(writeDir), jsonData, function (err) {
        if (err) {
            throw err
        }
        console.log("Write address to file success. ")
    })
}

coppyFile = obj => {
    return new Promise((resolve, _) => {
        fs.copyFile(path.resolve(`artifacts/contracts/${obj.folder}/${obj.file}`), path.resolve(`client/src/abi/${obj.file}`), err => {
            if (err) throw err
            console.log(`Write ${obj.file} success.`)
        })
    })
}

exports.writeAbiFile = async (arrayDir) => {
    await Promise.all(arrayDir.map(async (obj, index) => {
        await coppyFile(obj)
    }))
}
