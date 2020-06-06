const notifySlack = require('../notifications/slack')
const packageArray = require('../definitions/package-array')

const userAccountNotification = {
    'text': 'Salesforce metadata types detected that are not found in the mapping array. These will be skipped until the tic-sfpkg-cli is updated.', // text
    'attachments': []
};

const checkNode = (name, members) => {

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

const checkNodes = (obj) => {
    let types = obj.Package.types;
    for (let val of types) {
        checkNode(val.name[0], val.members);
    }

    if (userAccountNotification.attachments.length > 0) {
        notifySlack(userAccountNotification, options.slackurl);
    }
}

module.exports = checkNodes