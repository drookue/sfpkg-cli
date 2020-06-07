
const boxen = require("boxen")
const chalk = require("chalk")

const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    backgroundColor: "#555555"
}

const displayHeader = () => {
    let greeting = chalk.white.bold("Salesforce Package Deployment")
    let msgBox = boxen(greeting, boxenOptions)
    console.log(msgBox)
}

module.exports = {
    boxen,
    boxenOptions,
    displayHeader
}