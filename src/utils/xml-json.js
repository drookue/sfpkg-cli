const fs = require('fs')

const xml2js = require('xml2js')
const { options } = require('../utils/yargs')
const exitApp = require('./exit-app')

const packagexml2json = async () => {
    let pkgxml = `${options.pkgxml}`
    let xml = fs.readFileSync(pkgxml, 'utf8')

    try {
        var parser = new xml2js.Parser(/* options */)
        const result = await parser.parseStringPromise(xml)
        return JSON.stringify(result)
    } catch (error) {
        exitApp('XML cannot be converted to JSON.\nCheck the `${options.pkgxml}` file to ensure it is not malformed.')
    }
}

module.exports = packagexml2json