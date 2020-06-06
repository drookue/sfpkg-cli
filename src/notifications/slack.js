const https = require('https');

/**
* Handles the actual sending request.
* We're turning the https.request into a promise here for convenience
* @param webhookURL
* @param messageBody
* @return {Promise}
*/
const sendSlackMessage = (webhookURL, messageBody) => {
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

const notifySlack = async (message, url) => {
    if (url !== 'undefined' && url !== null && url != '') {
        try {
            const slackResponse = await sendSlackMessage(url, message);
            //console.log('Message response', slackResponse);
        } catch (e) {
            console.error('\nThere was a error with the slack request. Continuing execution.\n', e);
        }
    }
}

module.exports = notifySlack