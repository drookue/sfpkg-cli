const fs = require('fs')

const xml2js = require('xml2js')
const { options } = require('../utils/yargs')

const packagexml2json = async () => {
    let pkgxml = `${options.pkgxml}`;
    let xml = fs.readFileSync(pkgxml, 'utf8');
    let parseString = require('xml2js').parseString;

    return new Promise((resolve, reject) => {
        // With parser
        var parser = new xml2js.Parser(/* options */);
        parser.parseStringPromise(xml).then((result) => {
            resolve(JSON.stringify(result));
        })
            .catch((err) => {
                exitApp('XML cannot be converted to JSON.\nCheck the `${options.pkgxml}` file to ensure it is not malformed.');
            });
    })
}

module.exports = packagexml2json