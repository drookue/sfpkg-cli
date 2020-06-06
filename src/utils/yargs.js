const yargs = require("yargs");

const demandOption = process.env.YARG_DEMAND === 'true' || process.env.YARG_DEMAND === undefined

const options = yargs
    .usage('Usage: tic-sfpkg -s <force-app-folder> -d <vscode-project> -f <package.xml> -u <slack-webhook-url>')
    .option('s', { alias: 'src', describe: 'Source directory', type: 'string', demandOption })
    .option('d', { alias: 'deploy', describe: 'Deploy directory', type: 'string', demandOption: false })
    .option('f', { alias: 'pkgxml', describe: 'package.xml', type: 'string', demandOption: false })
    .option('u', { alias: 'slackurl', describe: 'Slack URL', type: 'string', demandOption: false })
    .argv;


if (process.env.YARG_DEMAND) {
    options.slackurl = process.env.SLACK_WEBHOOK_URL
    options.src = process.env.SRC_PATH
    options.deploy = process.env.DEST_PATH
    options.pkgxml = process.env.XML_PATH
}

module.exports = options