
const colors = require('colors')

const notifySlack = require('../notifications/slack')
const packageArray = require('../definitions/package-array')
const {
    processGeneric,
    processGenericByFolder,
    processObjectItem,
    processGenericWithFile,
    processFolder,
    processCustomLabel,
    processWorkflow,
    processDifferentMeta,
    processDifferentMetaWithFile,
    processStaticResource
} = require('../utils/process-files')

const stringProcessing = colors.green('     Processing metadata category:')

const userAccountNotification = {
    'text': 'Salesforce metadata types detected that are not found in the mapping array. These will be skipped until the sfpkg-cli is updated.', // text
    'attachments': []
}

const checkNode = (name, members) => {

    let testval = packageArray[name]

    if (typeof (testval) === 'undefined') {
        let msgBox = '     Skipping unknown metadata category: ' + name
        console.log(colors.red(msgBox))
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
        })
    }
}

const checkNodes = (obj) => {
    let types = obj.Package.types
    for (let val of types) {
        checkNode(val.name[0], val.members)
    }

    if (userAccountNotification.attachments.length > 0) {
        notifySlack(userAccountNotification, options.slackurl)
    }
}

const processNodes = (obj) => {
    let types = obj.Package.types
    for (let val of types) {
        let name = val.name[0]

        if (typeof (packageArray[name]) !== 'undefined') {
            console.log(stringProcessing, name)
            switch (name) {
                /** The following is to process static resources */
                case "StaticResource":
                    processStaticResource('resource', packageArray[name], val.members)
                    break
                /** The following all have 2 files for each node in the package.xml file */
                case "ApexClass":
                    processGenericWithFile('cls', packageArray[name], val.members)
                    break
                case "ApexComponent":
                    processGenericWithFile('component', packageArray[name], val.members)
                    break
                case "ApexPage":
                    processGenericWithFile('page', packageArray[name], val.members)
                    break
                case "ApexTrigger":
                    processGenericWithFile('trigger', packageArray[name], val.members)
                    break
                case "NetworkBranding":
                    processGenericWithFile('networkBranding', packageArray[name], val.members)
                    break
                /** The following have a single file per object even though there are many entries in the package.xml file */
                case "AssignmentRules":
                case "AssignmentRule":
                case "AutoResponseRule":
                case "AutoResponseRules":
                case "SharingCriteriaRule":
                case "SharingOwnerRule":
                case "SharingRules":
                    processGenericByFolder(packageArray[name], val.members, 0)
                    break
                case "MatchingRule":
                    processGenericByFolder(packageArray[name], val.members, 1)
                    break
                case "ApprovalProcess":
                    processGeneric(packageArray[name], val.members, 2)
                    break
                /** The following is a custom process for CustomLabels which is a single file in the labels folder */
                case "CustomLabel":
                    processCustomLabel(packageArray[name], val.members)
                    break
                /** The following is a custom function that handles the different meta filename than the default */
                case "Community":
                    processDifferentMeta("community", packageArray[name], val.members)
                    break
                case "CustomApplication":
                    processDifferentMeta("app", packageArray[name], val.members)
                    break
                case "CustomMetadata":
                    processDifferentMeta("md", packageArray[name], val.members, false)
                    break
                case "CustomPageWebLink":
                    processDifferentMeta("custompageweblink", packageArray[name], val.members)
                    break
                case "EmailServicesFunction":
                    processDifferentMeta("xml", packageArray[name], val.members)
                    break
                case "KeywordList":
                    processDifferentMeta("keywords", packageArray[name], val.members)
                    break
                case "Letterhead":
                    processDifferentMeta("letter", packageArray[name], val.members)
                    break
                case "ManagedTopics":
                    processDifferentMeta("managedTopics", packageArray[name], val.members)
                    break
                case "ModerationRule":
                    processDifferentMeta("rule", packageArray[name], val.members, false)
                    break
                case "ProfilePasswordPolicy":
                    processDifferentMeta("profilePasswordPolicy", packageArray[name], val.members)
                    break
                case "RemoteSiteSetting":
                    processDifferentMeta("remoteSite", packageArray[name], val.members)
                    break
                case "Settings":
                    processDifferentMeta("settings", packageArray[name], val.members)
                    break
                /** The following is a custom function that handles the different meta filename than the default with two files */
                case "Certificate":
                    processDifferentMetaWithFile("crt", packageArray[name], val.members)
                    break
                case "ContentAsset":
                    processDifferentMetaWithFile("asset", packageArray[name], val.members)
                    break
                case "SitDotCom":
                    processDifferentMetaWithFile("site", packageArray[name], val.members)
                    break
                /** The following are categories require the entire directory to be copied */
                case "AuraDefinitionBundle":
                case "Dashboard":
                case "Document":
                case "EmailTemplate":
                case "LightningComponentBundle":
                case "Report":
                    processFolder(packageArray[name], val.members)
                    break
                /** The follow are all located in the objects folder structure */
                case "BusinessProcess":
                    processObjectItem('businessProcesses', packageArray[name], val.members, 2)
                    break
                case "CompactLayout":
                    processObjectItem('compactLayouts', packageArray[name], val.members)
                    break
                case "CustomField":
                    processObjectItem('fields', packageArray[name], val.members)
                    break
                case "CustomObject":
                    processObjectItem('objects', packageArray[name], val.members)
                    break
                case "CustomObjectTranslation":
                    processObjectItem('objectTranslations', packageArray[name], val.members)
                    break
                case "FieldSet":
                    processObjectItem('fieldSets', packageArray[name], val.members)
                    break
                case "ListView":
                    processObjectItem('listViews', packageArray[name], val.members)
                    break
                case "RecordType":
                    processObjectItem('recordTypes', packageArray[name], val.members)
                    break
                case "ValidationRule":
                    processObjectItem('validationRules', packageArray[name], val.members)
                    break
                case "WebLink":
                    processObjectItem('webLinks', packageArray[name], val.members)
                    break
                /** The following are all have meta files names that match the folder name */
                case "Audience":
                case "TopicsForObjects":
                case "UserCriteria":
                    processGeneric(packageArray[name], val.members, 0)
                    break
                /** The following are all located in the workflows folder */
                case "Workflow":
                case "WorkflowAlert":
                case "WorkflowFieldUpdate":
                case "WorkflowKnowledgePublish":
                case "WorkflowOutboundMessage":
                case "WorkflowRule":
                case "WorkflowSend":
                case "WorkflowTask":
                    processWorkflow(packageArray[name], val.members)
                    break
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
                    processGeneric(packageArray[name], val.members)
                    break
            }
        }
        else {
            //
        }
    }
}

module.exports = {
    checkNodes,
    processNodes
}