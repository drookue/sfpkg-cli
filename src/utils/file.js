const fs = require('fs')
const exitApp = require('./exit-app')

const copyFile = (srcpath, destpath) => {
    try {
        fs.copyFile(srcpath, destpath, (err) => {
            if (err) throw err
        })
    } catch (err) {
        exitApp("Failed to copy " + srcpath)
    }
}

module.exports = {
    copyFile
}