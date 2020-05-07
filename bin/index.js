#!/usr/bin/env node

const chalk = require("chalk");
const boxen = require("boxen");
const yargs = require("yargs");
const xml2js = require('xml2js');
const fs = require('fs');
const https = require('https');

const boxenOptions = {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    backgroundColor: "#555555"
};

const userAccountNotification = {
    'text': 'Salesforce metadata types detected that are not found in the mapping array. These will be skipped until the tic-sfpkg-cli is updated.', // text
    'attachments': []
};

const packageArray = {
    //ApexClass: "classes",
    //ApexComponent: "components",
    //ApexPage: "pages",
    //ApexTrigger: "triggers",
    //AppMenu: "appMenus",
    //ApprovalProcess: "approvalProcesses",
    //AssignmentRule: "assignmentRules",
    //AssignmentRules: "assignmentRules",
    //Audience: "audience",
    //AuraDefinitionBundle: "aura",
    //AuthProvider: "authproviders",
    //AutoResponseRule: "autoResponseRules",
    //AutoResponseRules: "autoResponseRules",
    //BrandingSet: "brandingSets",
    //BusinessProcess: "objects",
    //Certificate: "certs",
    //CleanDataService: "cleanDataServices",
    //Community: "communities",
    //CompactLayout: "objects",
    //ConnectedApp: "connectedapps",
    //ContentAsset: "contentassets",
    //CspTrustedSite: "cspTrustedSites",
    //CustomApplication: "applications",
    CustomField: "objects",
    //CustomLabel: "labels",
    //CustomLabels: "labels",
    //CustomMetadata: "customMetadata",
    //CustomObject: "objects",
    //CustomObjectTranslation: "objectTranslations",
    //CustomPageWebLink: "weblinks",
    //CustomPermission: "customPermissions",
    //CustomSite: "sites",
    //CustomTab: "tabs",
    //Dashboard: "dashboards",
    //DelegateGroup: "delegateGroups",
    //Document: "documents",
    //DuplicateRule: "duplicateRules",
    //EmailServicesFunction: "emailservices",
    //EmailTemplate: "email",
    //FieldSet: "objects",
    FlexiPage: "flexipages",
    //Flow: "flows",
    //FlowDefinition: "flowDefinitions",
    //GlobalValueSet: "globalValueSets",
    //Group: "groups",
    //HomePageComponent: "homePageComponents",
    //HomePageLayout: "homePageLayouts",
    //KeywordList: "moderation",
    Layout: "layouts",
    //LeadConvertSettings: "LeadConvertSettings",
    //Letterhead: "letterhead",
    //LightningExperienceTheme: "lightningExperienceThemes",
    ListView: "objects",
    //ManagedTopics: "managedTopics",
    //MatchingRule: "matchingRules",
    //MatchingRules: "matchingRules",
    //ModerationRule: "moderation",
    //NamedCredential: "namedCredentials",
    //Network: "networks",
    //NetworkBranding: "networkBranding",
    //PathAssistant: "pathAssistants",
    PermissionSet: "permissionsets",
    Profile: "profiles",
    //ProfilePasswordPolicy: "profilePasswordPolicies",
    //ProfileSessionSetting: "profileSessionSettings",
    //Queue: "queues",
    //QuickAction: "quickActions",
    //RecordType: "objects",
    //RemoteSiteSetting: "remoteSiteSettings",
    //Report: "reports",
    //ReportType: "reportTypes",
    //Role: "roles",
    //SamlSsoConfig: "samlssoconfigs",
    //Settings: "settings",
    //SharingCriteriaRule: "sharingRules",
    //SharingGuestRule: "sharingRules",
    //SharingOwnerRule: "sharingRules",
    //SharingRules: "sharingRules",
    //SharingTerritoryRule: "sharingRules",
    //StandardValueSet: "standardValueSets",
    //TopicsForObjects: "topicsForObjects",
    //UserCriteria: "userCriteria",
    //ValidationRule: "objects",
    //WebLink: "objects",
    Workflow: "workflows"
    //WorkflowAlert: "workflows",
    //WorkflowFieldUpdate: "workflows",
    //WorkflowKnowledgePublish: "workflows",
    //WorkflowOutboundMessage: "workflows",
    //WorkflowRule: "workflows",
    //WorkflowSend: "workflows",
    //WorkflowTask: "workflows"
}

const options = yargs
    .usage("Usage: -s <src> -d <deploy> -f <pkgxml> -u <slackurl>")
    .option("s", { alias: "src", describe: "Source directory", type: "string", demandOption: true })
    .option("d", { alias: "deploy", describe: "Deploy directory", type: "string", demandOption: true })
    .option("f", { alias: "pkgxml", describe: "package.xml", type: "string", demandOption: true })
    .option("u", { alias: "slackurl", describe: "Slack URL", type: "string", demandOption: false})
    .argv;

/**
* Handles the actual sending request.
* We're turning the https.request into a promise here for convenience
* @param webhookURL
* @param messageBody
* @return {Promise}
*/
function sendSlackMessage(webhookURL, messageBody) {
    // make sure the incoming message body can be parsed into valid JSON
    try {
        messageBody = JSON.stringify(messageBody);
    } catch (e) {
        throw new Error('Failed to stringify messageBody for Slack', e);
        exitApp('Failed to stringify messageBody for Slack');
    }

    // Promisify the https.request
    return new Promise((resolve, reject) => {
        // general request options, we defined that it's a POST request and content is JSON
        const requestOptions = {
            method: 'POST',
            header: {
                'Content-Type': 'application/json'
            }
        };

        // actual request
        const req = https.request(webhookURL, requestOptions, (res) => {
            let response = '';


            res.on('data', (d) => {
                response += d;
            });

            // response finished, resolve the promise with data
            res.on('end', () => {
                resolve(response);
            })
        });

        // there was an error, reject the promise
        req.on('error', (e) => {
            reject(e);
        });

        // send our message body (was parsed to JSON beforehand)
        req.write(messageBody);
        req.end();
    });
}

async function notifySlack(message) {
    url = `${options.slackurl}`;
    if (url !== 'undefined' && url !== null && url != '') {
        try {
            const slackResponse = await sendSlackMessage(url, message);
            //console.log('Message response', slackResponse);
        } catch (e) {
            console.error('There was a error with the slack request. Continuing execution.', e);
        }
    }
}

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

function validateArguments() {
    try {
        if (!fs.existsSync(`${options.src}`)) {
            exitApp('The src directory does not exist.');
        }
    } catch (err) {
        console.error(err);
    }

    try {
        if (!fs.existsSync(`${options.pkgxml}`)) {
            exitApp('The xml file does not exist.');
        }
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

function checkNode(name, members) {

    let testval = packageArray[name];

    if (typeof (testval) === 'undefined') {
        console.log('Skipping unknown metadata category:', name)
        userAccountNotification.attachments.push({ // this defines the attachment block, allows for better layout usage
            'color': '#ff0000', // color of the attachments sidebar.
            'fields': [ // actual fields
                {
                    'title': 'Category', // Custom field
                    'value': name, // Custom value
                    'short': true // long fields will be full width
                },
                {
                    'title': 'Value',
                    'value': packageArray[name],
                    'short': true
                }
            ]
        });
    }
}

function displayHeader(){
    let greeting = chalk.white.bold("Salesforce Package Deployment");
    let msgBox = boxen(greeting, boxenOptions);
    console.log(msgBox);
}

validateArguments();

function resetDeployDir() {
    let deleteFolderRecursive = function (path) {
        try {
            if (fs.existsSync(path)) {
                fs.readdirSync(path).forEach(function (file, index) {
                    let curPath = path + "/" + file;
                    if (fs.lstatSync(curPath).isDirectory()) { // recurse
                        deleteFolderRecursive(curPath);
                    } else { // delete file
                        fs.unlinkSync(curPath);
                    }
                });
                fs.rmdirSync(path);
            }
        }
        catch (err) {
            console.error(err);
            process.exit(1);
        }
    };

    let dir;
    dir = `${options.deploy}`;
    deleteFolderRecursive(dir);
    createDir(dir);

    dir = `${options.deploy}` + '/force-app';
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main';
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main/default';
    createDir(dir);
}

function packagexml2json(){
    return new Promise((resolve, reject) => {
        let pkgxml = `${options.pkgxml}`;
        let xml = fs.readFileSync(pkgxml, 'utf8');

        let parseString = require('xml2js').parseString;

        parseString(xml, function (err, result) {
            delete result.Package.$;
            delete result.Package.version;
            resolve(JSON.stringify(result));
        });
    })
}

function checkNodes(obj){
    let types = obj.Package.types;
    for (let val of types) {
        checkNode(val.name[0], val.members);
    }

    if (userAccountNotification.attachments.length > 0) {
        notifySlack(userAccountNotification);
    }
}

function createDir(dir){
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
}

function copyFile(srcpath, destpath){
    try {
        fs.copyFile(srcpath, destpath, (err) => {
            if (err) throw err;
        });
    } catch (err) {
        exitApp(err);
    }
}

function processGeneric(path, members){
    const meta = '.' + path.substring(0, path.length - 1) + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let file = member;
        let srcpath = `${options.src}` + '/force-app/main/default/' + path + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processObjectItem(type, path, members){
    const subdir = '/' + type;
    const meta = '.' + type.substring(0, type.length - 1) + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let folder = nameArr[0];
        let file = nameArr[1];

        dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder;
        createDir(dir);

        dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir;
        createDir(dir);

        let srcpath = `${options.src}` + '/force-app/main/default/' + path + '/' + folder + subdir + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processNodes(obj) {
    let types = obj.Package.types;
    for (let val of types) {
        let name = val.name[0];

        if (typeof(packageArray[name]) !== 'undefined'){
            switch (name) {
                case "CustomField":
                    console.log('Processing', name);
                    processObjectItem('fields', packageArray[name], val.members);
                    break;
                case "ListView":
                    console.log('Processing', name);
                    processObjectItem('listViews', packageArray[name], val.members);
                    break;
                case "ValidationRule":
                    console.log('Processing', name);
                    processObjectItem('validationRules', packageArray[name], val.members);
                    break;
                default:
                    console.log('Processing', name);
                    processGeneric(packageArray[name], val.members);
                    break;
            }
        }
        else {
            console.log('SKIPPING', name);
        }
    }
}


async function main(){
    displayHeader();
    resetDeployDir();
    let json = await packagexml2json();
    const obj = JSON.parse(json);
    checkNodes(obj);
    processNodes(obj);
}

main();