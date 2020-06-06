const boxen = require('./box')

function exitApp(message) {
    const boxenOptions = {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "red",
    };

    let msgBox = boxen(message, boxenOptions);

    console.log(msgBox);
    process.exit(1);
}

module.exports = exitApp