#!/usr/bin/env node

const { validateArguments } = require('../src/utils/yargs')
const { displayHeader } = require('../src/utils/box')
const { resetDeployDir } = require('../src/utils/directory')
const { checkNodes, processNodes } = require('../src/utils/nodes')
const packagexml2json = require('../src/utils/xml-json')

const main = async () => {
    validateArguments()
    displayHeader()
    resetDeployDir()
    const json = await packagexml2json()
    const obj = JSON.parse(json)
    checkNodes(obj)
    processNodes(obj)

    console.log("\n\n Execution completed")
}

main()