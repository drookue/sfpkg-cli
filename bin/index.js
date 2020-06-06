#!/usr/bin/env node

const chalk = require("chalk");
const xml2js = require('xml2js');
const fs = require('fs');
const colors = require('colors');

const packageArray = require('../src/definitions/package-array')
const {options, validateArguments} = require('../src/utils/yargs')
const { boxen, boxenOptions } = require('../src/utils/box')
const exitApp = require('../src/utils/exit-app')
const { copyFile } = require('../src/utils/file')
const { createDir, copyDirectory, resetDeployDir } = require('../src/utils/directory')
const checkNodes = require('../src/utils/nodes')

const stringProcessing = colors.green('     Processing metadata category:');

const displayHeader = () => {
    let greeting = chalk.white.bold("Salesforce Package Deployment");
    let msgBox = boxen(greeting, boxenOptions);
    console.log(msgBox);
}

const packagexml2json = () => {
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

const processGeneric = (path, members, pathLen=1) => {
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

const processGenericByFolder = (path, members, pathLen = 1) => {
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

const processObjectItem = (type, path, members, pathLen = 1) => {
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

const processGenericWithFile = (extension, path, members) => {
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


const processFolder = (path, members) => {
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

const processCustomLabel = (path, members) => {
    let dir;
    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    let file = 'CustomLabels.labels-meta.xml';

    let srcpath = `${options.src}` + '/main/default/' + path + '/' + file;
    let destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file;

    copyFile(srcpath, destpath);
}

const processWorkflow = (path, members) => {
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

const processDifferentMeta = (metaext, path, members, split = true) => {
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

const processDifferentMetaWithFile = (metaext, path, members, split = true) => {
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

const processStaticResource = (metaext, path, members) => {
    const meta = '.' + metaext + '-meta.xml';

    let dir;
    let srcpath;
    let destpath;
    let files = new Array();

    dir = `${options.deploy}` + '/force-app/main/default/' + path;
    createDir(dir);

    srcpath = `${options.src}` + '/main/default/' + path;
    fs.readdirSync(srcpath).forEach(file => {
        if (!file.endsWith(meta)){
            let filebits = file.split('.');
            let thisfile = new Array();
            if (filebits.length > 1) {
                thisfile["ext"] = filebits[filebits.length - 1];
                filebits.length = filebits.length - 1;
            }
            thisfile["name"] = filebits.join('');
            files.push(thisfile);
        }
    });

    for (let member of members) {
        let file = files.filter(f => f.name == member)[0];
        if (file.ext === undefined) {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + file.name;
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file.name;
            copyFile(srcpath + meta, destpath + meta);
            copyDirectory(srcpath, destpath);
        } else {
            srcpath = `${options.src}` + '/main/default/' + path + '/' + file.name;
            destpath = `${options.deploy}` + '/force-app/main/default/' + path + '/' + file.name;
            copyFile(srcpath + meta, destpath + meta);
            copyFile(srcpath + '.' + file.ext, destpath + '.' + file.ext);
        }
    }
}

const processNodes = (obj) => {
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

const main = async () => {
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