#!/usr/bin/env node

const chalk = require("chalk");
const boxen = require("boxen");
const yargs = require("yargs");
const xml2js = require('xml2js');
const fs = require('fs');
const https = require('https');
const colors = require('colors');
const stringProcessing = colors.green('     Processing metadata category:');
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
    ApexClass: "classes",
    ApexComponent: "components",
    ApexPage: "pages",
    ApexTestSuite: "testSuites",
    ApexTrigger: "triggers",
    AppMenu: "appMenus",
    ApprovalProcess: "approvalProcesses",
    AssignmentRule: "assignmentRules",
    AssignmentRules: "assignmentRules",
    Audience: "audience",
    AuraDefinitionBundle: "aura",
    AuthProvider: "authproviders",
    AutoResponseRule: "autoResponseRules",
    AutoResponseRules: "autoResponseRules",
    BrandingSet: "brandingSets",
    BusinessProcess: "objects",
    CampaignInfluenceModel: "campaignInfluenceModels",
    Certificate: "certs",
    CleanDataService: "cleanDataServices",
    Community: "communities",
    CompactLayout: "objects",
    ConnectedApp: "connectedApps",
    ContentAsset: "contentassets",
    CspTrustedSite: "cspTrustedSites",
    CustomApplication: "applications",
    CustomField: "objects",
    CustomLabel: "labels",
    //CustomLabels: "labels",
    CustomMetadata: "customMetadata",
    CustomObject: "objects",
    CustomObjectTranslation: "objectTranslations",
    CustomPageWebLink: "weblinks",
    CustomPermission: "customPermissions",
    CustomSite: "sites",
    CustomTab: "tabs",
    Dashboard: "dashboards",
    DelegateGroup: "delegateGroups",
    Document: "documents",
    DuplicateRule: "duplicateRules",
    EmailServicesFunction: "emailservices",
    EmailTemplate: "email",
    FieldSet: "objects",
    FlexiPage: "flexipages",
    Flow: "flows",
    FlowDefinition: "flowDefinitions",
    GlobalValueSet: "globalValueSets",
    Group: "groups",
    HomePageComponent: "homePageComponents",
    HomePageLayout: "homePageLayouts",
    KeywordList: "moderation",
    Layout: "layouts",
    LeadConvertSettings: "LeadConvertSettings",
    Letterhead: "letterhead",
    LightningComponentBundle: "lwc",
    LightningExperienceTheme: "lightningExperienceThemes",
    ListView: "objects",
    ManagedTopics: "managedTopics",
    MatchingRule: "matchingRules",
    MatchingRules: "matchingRules",
    ModerationRule: "moderation",
    NamedCredential: "namedCredentials",
    NavigationMenu: "navigationMenus",
    Network: "networks",
    NetworkBranding: "networkBranding",
    PathAssistant: "pathAssistants",
    PermissionSet: "permissionsets",
    Profile: "profiles",
    ProfilePasswordPolicy: "profilePasswordPolicies",
    ProfileSessionSetting: "profileSessionSettings",
    Queue: "queues",
    QuickAction: "quickActions",
    RecordType: "objects",
    RemoteSiteSetting: "remoteSiteSettings",
    Report: "reports",
    ReportType: "reportTypes",
    Role: "roles",
    SamlSsoConfig: "samlssoconfigs",
    Settings: "settings",
    SharingCriteriaRule: "sharingRules",
    //SharingGuestRule: "sharingRules",
    SharingOwnerRule: "sharingRules",
    SharingRules: "sharingRules",
    //SharingTerritoryRule: "sharingRules",
    SiteDotCom: "siteDotComSites",
    StandardValueSet: "standardValueSets",
    StaticResource: "staticresources",
    TopicsForObjects: "topicsForObjects",
    Translations: "translations",
    UserCriteria: "userCriteria",
    ValidationRule: "objects",
    WebLink: "objects",
    Workflow: "workflows",
    WorkflowAlert: "workflows",
    WorkflowFieldUpdate: "workflows",
    WorkflowKnowledgePublish: "workflows",
    WorkflowOutboundMessage: "workflows",
    WorkflowRule: "workflows",
    WorkflowSend: "workflows",
    WorkflowTask: "workflows"
}

const options = yargs
    .usage("Usage: tic-sfpkg -s <force-app-folder> -d <vscode-project> -f <package.xml> -u <slack-webhook-url>")
    .option("s", { alias: "src", describe: "Source directory", type: "string", demandOption: true })
    .option("d", { alias: "deploy", describe: "Deploy directory", type: "string", demandOption: true })
    .option("f", { alias: "pkgxml", describe: "package.xml", type: "string", demandOption: true })
    .option("u", { alias: "slackurl", describe: "Slack URL", type: "string", demandOption: false})
    .argv;


const Directories = [];

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
        console.log('Failed to stringify messageBody for Slack');
        throw new Error('Failed to stringify messageBody for Slack', e);
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
            console.error('\nThere was a error with the slack request. Continuing execution.\n', e);
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
        let msgBox = '     Skipping unknown metadata category: ' + name;
        console.log(colors.red(msgBox));
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
                    'value': 'undefined',
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
    createDir(dir);

    dir = `${options.deploy}` + '/force-app';
    deleteFolderRecursive(dir);
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main';
    createDir(dir);

    dir = `${options.deploy}` + '/force-app/main/default';
    createDir(dir);
}

function packagexml2json(){
    let pkgxml = `${options.pkgxml}`;
    let xml = fs.readFileSync(pkgxml, 'utf8');
    let parseString = require('xml2js').parseString;

    return new Promise((resolve, reject) => {
        // With parser
        var parser = new xml2js.Parser(/* options */);
        parser.parseStringPromise(xml).then(function (result) {
            resolve(JSON.stringify(result));
        })
            .catch(function (err) {
                exitApp('XML cannot be converted to JSON.\nCheck the `${options.pkgxml}` file to ensure it is not malformed.');
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
        exitApp("Failed to copy " + srcpath);
    }
}

function processGeneric(path, members, pathLen=1){
    const meta = '.' + path.substring(0, path.length - pathLen) + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let file = member;
        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processGenericByFolder(path, members, pathLen = 1) {
    const meta = '.' + path.substring(0, path.length - pathLen) + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let file = nameArr[0];

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processObjectItem(type, path, members, pathLen = 1){
    const subdir = '/' + type;
    const meta = '.' + type.substring(0, type.length - pathLen) + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let folder = nameArr[0];
        let file = nameArr[1];

        dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder;
        createDir(dir);

        let srcpath;
        let destpath;
        if (type == 'objects' || type == 'objectTranslations') {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + folder + '/' + folder + meta;
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + '/' + folder + meta;
        } else {
            dir = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir;
            createDir(dir);

            srcpath = `${options.src}` + '/main/default/' + path + '/' + folder + subdir + '/' + file + meta;
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + folder + subdir + '/' + file + meta;
        }
        copyFile(srcpath, destpath);


    }
}

function processGenericWithFile(extension, path, members) {
    const meta = '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let file = member + '.' + extension;
        let srcpath;
        let destpath;

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file;
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file;
        copyFile(srcpath, destpath);

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;
        copyFile(srcpath, destpath);
    }
}

function copyDirectory(srcpath, destpath) {
    return new Promise((resolve, reject) => {
        const ncp = require('ncp').ncp;

        if (!Directories.includes(srcpath)) {
            Directories.push(srcpath);
            ncp.limit = 16;

            ncp(srcpath, destpath, function (err) {
                if (err) {
                    throw new Error("Failed to copy " + srcpath, err);
                    //exitApp("Failed to copy " + srcpath);
                }
            });
        }
  }).then((state) => {
        //console.log('done', state)
    })
    .catch((error) => {
        throw new Error("Failed to copy " + srcpath, err);
    });
}

function processFolder(path, members) {
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        dir = member;
        let srcpath = `${options.src}` + '/main/default/' + path + '/' + dir;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + dir;

        if (path == 'dashboards' || path == 'documents' || path == 'email' || path == 'reports'){
            let nameArr = member.split('/');
            dir = nameArr[0];
            file = nameArr[1];

            if (file === undefined && path != 'email') {
                switch (path){
                    case 'dashboards':
                        processDifferentMeta('dashboardFolder', path, member.split());
                        break;
                    case 'documents':
                        processDifferentMeta('documentFolder', path, member.split());
                        break;
                    case 'reports':
                        processDifferentMeta('reportFolder', path, member.split());
                        break;
                }
                if (fs.existsSync(srcpath)) {
                    copyDirectory(srcpath, destpath);
                }
            } else if (path == 'email') {
                if (file === undefined) {
                    processDifferentMeta('emailFolder', path, member.split());
                }
                srcpath = `${options.src}` + '/main/default/' + path + '/' + dir;
                destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + dir;

                if (!fs.existsSync(destpath) && fs.existsSync(srcpath)) {
                    copyDirectory(srcpath, destpath);
                }
            }
        } else {
            copyDirectory(srcpath, destpath);
        }

    }
}

function processCustomLabel(path, members) {
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    let file = 'CustomLabels.labels-meta.xml';

    let srcpath = `${options.src}` + '/main/default/' + path + '/' + file;
    let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file;

    copyFile(srcpath, destpath);
}

function processWorkflow(path, members){
    const meta = '.workflow-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let file = nameArr[0];

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processDifferentMeta(metaext, path, members, split = true) {
    const meta = '.' + metaext + '-meta.xml';
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let file = (split === true && metaext != 'keywords') ? nameArr[0] : member;

        let srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);
    }
}

function processDifferentMetaWithFile(metaext, path, members, split = true) {
    const meta = '.' + metaext + '-meta.xml';
    const fileext = '.' + metaext;
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    for (let member of members) {
        let nameArr = member.split('.');
        let file = (split === true) ? nameArr[0] : member;

        let srcpath;
        let destpath;

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + meta;
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + meta;

        copyFile(srcpath, destpath);

        srcpath = `${options.src}` + '/main/default/' + path + '/' + file + fileext;
        destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file + fileext;

        copyFile(srcpath, destpath);
    }
}

function processStaticResource(metaext, path, members) {
    const meta = '.' + metaext + '-meta.xml';
    const fileext = '.' + metaext;
    let dir;
    let srcpath;
    let destpath;
    let files = [];

    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    srcpath = `${options.src}` + '/main/default/' + path;
    fs.readdirSync(srcpath).forEach(file => {
        if (!file.endsWith(meta)){
            let filebits = file.split('.');
            let thisfile = new Array();
            if (filebits.length > 1) {
                thisfile[1] = filebits[filebits.length - 1];
                filebits.length = filebits.length - 1;
            }
            thisfile[0] = filebits.join('');
            files.push(thisfile);
        }
    });

    for (let member of members) {
        let nameArr = member.split('.');
        //console.log(member);
    }
}

function processNodes(obj) {
    let types = obj.Package.types;
    for (let val of types) {
        let name = val.name[0];

        if (typeof(packageArray[name]) !== 'undefined'){
            console.log(stringProcessing, name);
            switch (name) {
                /** The following is to process static resources */
                case "StaticResource":
                    processStaticResource('resource', packageArray[name], val.members);
                    break;
                /** The following all have 2 files for each node in the package.xml file */
                case "ApexClass":
                    processGenericWithFile('cls', packageArray[name], val.members);
                    break;
                case "ApexComponent":
                    processGenericWithFile('component', packageArray[name], val.members);
                    break;
                case "ApexPage":
                    processGenericWithFile('page', packageArray[name], val.members);
                    break;
                case "ApexTrigger":
                    processGenericWithFile('trigger', packageArray[name], val.members);
                    break;
                case "NetworkBranding":
                    processGenericWithFile('networkBranding', packageArray[name], val.members);
                    break;
                /** The following have a single file per object even though there are many entries in the package.xml file */
                case "AssignmentRules":
                case "AssignmentRule":
                case "AutoResponseRule":
                case "AutoResponseRules":
                case "SharingCriteriaRule":
                case "SharingOwnerRule":
                case "SharingRules":
                    processGenericByFolder(packageArray[name], val.members, 0);
                    break;
                case "MatchingRule":
                    processGenericByFolder(packageArray[name], val.members, 1);
                    break;
                case "ApprovalProcess":
                    processGeneric(packageArray[name], val.members, 2);
                    break;
                /** The following is a custom process for CustomLabels which is a single file in the labels folder */
                case "CustomLabel":
                    processCustomLabel(packageArray[name], val.members);
                    break;
                /** The following is a custom function that handles the different meta filename than the default */
                case "Community":
                    processDifferentMeta("community", packageArray[name], val.members);
                    break;
                case "CustomApplication":
                    processDifferentMeta("app", packageArray[name], val.members);
                    break;
                case "CustomMetadata":
                    processDifferentMeta("md", packageArray[name], val.members, false);
                    break;
                case "CustomPageWebLink":
                    processDifferentMeta("custompageweblink", packageArray[name], val.members);
                    break;
                case "EmailServicesFunction":
                    processDifferentMeta("xml", packageArray[name], val.members);
                    break;
                case "KeywordList":
                    processDifferentMeta("keywords", packageArray[name], val.members);
                    break;
                case "Letterhead":
                    processDifferentMeta("letter", packageArray[name], val.members);
                    break;
                case "ManagedTopics":
                    processDifferentMeta("managedTopics", packageArray[name], val.members);
                    break;
                case "ModerationRule":
                    processDifferentMeta("rule", packageArray[name], val.members, false);
                    break;
                case "ProfilePasswordPolicy":
                    processDifferentMeta("profilePasswordPolicy", packageArray[name], val.members);
                    break;
                case "RemoteSiteSetting":
                    processDifferentMeta("remoteSite", packageArray[name], val.members);
                    break;
                case "Settings":
                    processDifferentMeta("settings", packageArray[name], val.members);
                    break;
                /** The following is a custom function that handles the different meta filename than the default with two files */
                case "Certificate":
                    processDifferentMetaWithFile("crt", packageArray[name], val.members);
                    break;
                case "ContentAsset":
                    processDifferentMetaWithFile("asset", packageArray[name], val.members);
                    break;
                case "SitDotCom":
                    processDifferentMetaWithFile("site", packageArray[name], val.members);
                    break;
                /** The following are categories require the entire directory to be copied */
                case "AuraDefinitionBundle":
                case "Dashboard":
                case "Document":
                case "EmailTemplate":
                case "LightningComponentBundle":
                case "Report":
                    processFolder(packageArray[name], val.members);
                    break;
                /** The follow are all located in the objects folder structure */
                case "BusinessProcess":
                    processObjectItem('businessProcesses', packageArray[name], val.members, 2);
                    break;
                case "CompactLayout":
                    processObjectItem('compactLayouts', packageArray[name], val.members);
                    break;
                case "CustomField":
                    processObjectItem('fields', packageArray[name], val.members);
                    break;
                case "CustomObject":
                    processObjectItem('objects', packageArray[name], val.members);
                    break;
                case "CustomObjectTranslation":
                    processObjectItem('objectTranslations', packageArray[name], val.members);
                    break;
                case "FieldSet":
                    processObjectItem('fieldSets', packageArray[name], val.members);
                    break;
                case "ListView":
                    processObjectItem('listViews', packageArray[name], val.members);
                    break;
                case "RecordType":
                    processObjectItem('recordTypes', packageArray[name], val.members);
                    break;
                case "ValidationRule":
                    processObjectItem('validationRules', packageArray[name], val.members);
                    break;
                case "WebLink":
                    processObjectItem('webLinks', packageArray[name], val.members);
                    break;
                /** The following are all have meta files names that match the folder name */
                case "Audience":
                case "TopicsForObjects":
                case "UserCriteria":
                    processGeneric(packageArray[name], val.members, 0);
                    break;
                /** The following are all located in the workflows folder */
                case "Workflow":
                case "WorkflowAlert":
                case "WorkflowFieldUpdate":
                case "WorkflowKnowledgePublish":
                case "WorkflowOutboundMessage":
                case "WorkflowRule":
                case "WorkflowSend":
                case "WorkflowTask":
                    processWorkflow(packageArray[name], val.members);
                    break;
                /** The following are the default singular meta file loacted in plural directory names */
                case "ApexTestSuite":
                case "AppMenu":
                case "AuthProvider":
                case "BrandingSet":
                case "CampaignInfluenceModel":
                case "CleanDataService":
                case "ConnectedApp":
                case "CspTrustedSite":
                case "CustomSite":
                case "CustomTab":
                case "DelegateGroup":
                case "DuplicateRule":
                case "FlexiPage":
                case "Flow":
                case "FlowDefinition":
                case "GlobalValueSet":
                case "Group":
                case "HomePageComponent":
                case "HomePageLayout":
                case "Layout":
                case "LeadConvertSettings":
                case "LightningExperienceTheme":
                case "MatchingRules":
                case "NamedCredential":
                case "NavigationMenu":
                case "Network":
                case "PathAssistant":
                case "PermissionSet":
                case "Profile":
                case "ProfileSessionSetting":
                case "Queue":
                case "QuickAction":
                case "ReportType":
                case "Role":
                case "SamlSsoConfig":
                case "StandardValueSet":
                case "TopicsForObjects":
                case "Translations":
                case "UserCriteria":
                    processGeneric(packageArray[name], val.members);
                    break;
            }
        }
        else {
            //
        }
    }
}

async function main(){
    validateArguments();
    displayHeader();
    resetDeployDir();
    const json = await packagexml2json();
    const obj = JSON.parse(json);
    checkNodes(obj);
    processNodes(obj);

    console.log("\n\n Execution completed")
}

main();