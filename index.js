const config = require('./config/config');
const dialogs = require('./dialogs/dialog');
const bodyParser = require('body-parser');
const builder = require('botbuilder');
const server = require('express')();
const uuid = require('uuid');
const request = require('request');
const JSONbig = require('json-bigint');
const async = require('async');
const apiai = require('apiai');
const apiairecognizer = require('api-ai-recognizer');
const footballProvider = require('./providers/footballProvider');


const REST_PORT = (process.env.PORT || 5000);
const APIAI_ACCESS_TOKEN = process.env.API_TOKEN;
const APIAI_LANG = process.env.APIAI_LANG || 'en';
const FB_VERIFY_TOKEN = process.env.VERIFICATION_TOKEN;
const FB_PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const FB_TEXT_LIMIT = 640;

const FACEBOOK_LOCATION = "FACEBOOK_LOCATION";
const FACEBOOK_WELCOME = "FACEBOOK_WELCOME";
/**
 *  API.AI supports nearly 15 languages, but as the caution says:
 *  Caution: * Only one language per agent is supported.
 *  Language cannot be changed after creation of the agent.
 *  The NodeJS client doesn't permit this for now
 */


/**
 *  Create connector
 * @type {ChatConnector}
 */
const connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});
/**
 * Instanciate bot
 * @type {UniversalBot}
 */
const bot = new builder.UniversalBot(connector);
/**
 * Enable conversation data persistence
 */
bot.set('persistConversationData', true);

/**
 * Instanciate api.ai (recently DialogFlow)
 * @type {ApiAiRecognizer}
 */
const recognizer = new apiairecognizer(config.apiaiApp);
/**
 * Instanciate defined intents
 * @type {IntentDialog}
 */
const intents = new builder.IntentDialog({
    recognizers: [recognizer]
});

const cancelConversation = {
    matches: /^cancel$|^goodbye$|^skip$|^stop$/i,
    confirmPrompt: 'This will cancel your request. Are you sure?'
};
const startOverConversation = {
    matches: /^start over$/i
};

/**
 * Entry point
 */
bot.dialog('/', intents);
bot.dialog('globalNextTeamEvent', [
    (session, args, next) => {
        dialogs.askTeamNextEventDialog(session, args, next);
    },
    (session, results, next) => {
        dialogs.searchTeamByNameDialog(session, results, next);
    },
    (session, results, next) => {
        dialogs.next5EventsByTeamIdDialog(session, results, next);
    }
]);
bot.dialog('globalLastTeamEvent', [
    (session, args, next) => {
        dialogs.askTeamLastEventDialog(session, args, next);
    },
    (session, results, next) => {
        dialogs.searchTeamByNameDialog(session, results, next);
    },
    (session, results, next) => {
        dialogs.last5EventsByTeamIdDialog(session, results, next);
    }
]);
bot.dialog('globalNextCompetitionEvent', [
    (session, args, next) => {
        dialogs.askCountryCompetitionDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.askLeagueByCountryNameDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.next15EventsByLeagueIdDialog(session, args, next);
    },
]);
bot.dialog('globalLastCompetitionEvent', [
    (session, args, next) => {
        dialogs.askCountryCompetitionDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.askLeagueByCountryNameDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.last15EventsByLeagueIdDialog(session, args, next);
    },
]);
bot.dialog('globalGetTeamDetailEvent', [
    (session, args, next) => {
        dialogs.askTeamDetailsDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.searchTeamByNameDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.getDetailsByTeamIdDialog(session, args, next);
    },
]);
bot.dialog('globalGetPlayerDetailEvent', [
    (session, args, next) => {
        dialogs.askPlayerDetailsDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.searchPlayerByNameDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.getDetailsByPlayerIdDialog(session, args, next);
    },
]);


class FacebookBot {
    constructor() {
        this.apiAiService = apiai(APIAI_ACCESS_TOKEN, {language: APIAI_LANG, requestSource: "fb"});
        this.sessionIds = new Map();
        this.messagesDelay = 200;
    }


    doDataResponse(sender, facebookResponseData) {
        if (!Array.isArray(facebookResponseData)) {
            console.log('Response as formatted message');
            this.sendFBMessage(sender, facebookResponseData)
                .catch(err => console.error(err));
        } else {
            async.eachSeries(facebookResponseData, (facebookMessage, callback) => {
                if (facebookMessage.sender_action) {
                    console.log('Response as sender action');
                    this.sendFBSenderAction(sender, facebookMessage.sender_action)
                        .then(() => callback())
                        .catch(err => callback(err));
                }
                else {
                    console.log('Response as formatted message');
                    this.sendFBMessage(sender, facebookMessage)
                        .then(() => callback())
                        .catch(err => callback(err));
                }
            }, (err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log('Data response completed');
                }
            });
        }
    }

    doRichContentResponse(sender, messages) {
        let facebookMessages = []; // array with result messages

        for (let messageIndex = 0; messageIndex < messages.length; messageIndex++) {
            let message = messages[messageIndex];

            switch (message.type) {
                //message.type 0 means text message
                case 0:
                    // speech: ["hi"]
                    // we have to get value from fulfillment.speech, because of here is raw speech
                    if (message.speech) {

                        let splittedText = this.splitResponse(message.speech);

                        splittedText.forEach(s => {
                            facebookMessages.push({text: s});
                        });
                    }

                    break;
                //message.type 1 means card message
                case 1: {
                    let carousel = [message];

                    for (messageIndex++; messageIndex < messages.length; messageIndex++) {
                        if (messages[messageIndex].type == 1) {
                            carousel.push(messages[messageIndex]);
                        } else {
                            messageIndex--;
                            break;
                        }
                    }

                    let facebookMessage = {};
                    carousel.forEach((c) => {
                        // buttons: [ {text: "hi", postback: "postback"} ], imageUrl: "", title: "", subtitle: ""

                        let card = {};

                        card.title = c.title;
                        card.image_url = c.imageUrl;
                        if (this.isDefined(c.subtitle)) {
                            card.subtitle = c.subtitle;
                        }
                        //If button is involved in.
                        if (c.buttons.length > 0) {
                            let buttons = [];
                            for (let buttonIndex = 0; buttonIndex < c.buttons.length; buttonIndex++) {
                                let button = c.buttons[buttonIndex];

                                if (button.text) {
                                    let postback = button.postback;
                                    if (!postback) {
                                        postback = button.text;
                                    }

                                    let buttonDescription = {
                                        title: button.text
                                    };

                                    if (postback.startsWith("http")) {
                                        buttonDescription.type = "web_url";
                                        buttonDescription.url = postback;
                                    } else {
                                        buttonDescription.type = "postback";
                                        buttonDescription.payload = postback;
                                    }

                                    buttons.push(buttonDescription);
                                }
                            }

                            if (buttons.length > 0) {
                                card.buttons = buttons;
                            }
                        }

                        if (!facebookMessage.attachment) {
                            facebookMessage.attachment = {type: "template"};
                        }

                        if (!facebookMessage.attachment.payload) {
                            facebookMessage.attachment.payload = {template_type: "generic", elements: []};
                        }

                        facebookMessage.attachment.payload.elements.push(card);
                    });

                    facebookMessages.push(facebookMessage);
                }

                    break;
                //message.type 2 means quick replies message
                case 2: {
                    if (message.replies && message.replies.length > 0) {
                        let facebookMessage = {};

                        facebookMessage.text = message.title ? message.title : 'Choose an item';
                        facebookMessage.quick_replies = [];

                        message.replies.forEach((r) => {
                            facebookMessage.quick_replies.push({
                                content_type: "text",
                                title: r,
                                payload: r
                            });
                        });

                        facebookMessages.push(facebookMessage);
                    }
                }

                    break;
                //message.type 3 means image message
                case 3:

                    if (message.imageUrl) {
                        let facebookMessage = {};

                        // "imageUrl": "http://example.com/image.jpg"
                        facebookMessage.attachment = {type: "image"};
                        facebookMessage.attachment.payload = {url: message.imageUrl};

                        facebookMessages.push(facebookMessage);
                    }

                    break;
                //message.type 4 means custom payload message
                case 4:
                    if (message.payload && message.payload.facebook) {
                        facebookMessages.push(message.payload.facebook);
                    }
                    break;

                default:
                    break;
            }
        }

        return new Promise((resolve, reject) => {
            async.eachSeries(facebookMessages, (msg, callback) => {
                    this.sendFBSenderAction(sender, "typing_on")
                        .then(() => this.sleep(this.messagesDelay))
                        .then(() => this.sendFBMessage(sender, msg))
                        .then(() => callback())
                        .catch(callback);
                },
                (err) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                    } else {
                        console.log('Messages sent');
                        resolve();
                    }
                });
        });

    }

    doTextResponse(sender, responseText) {
        console.log('Response as text message');
        // facebook API limit for text length is 640,
        // so we must split message if needed
        let splittedText = this.splitResponse(responseText);

        async.eachSeries(splittedText, (textPart, callback) => {
            this.sendFBMessage(sender, {text: textPart})
                .then(() => callback())
                .catch(err => callback(err));
        });
    }

    //which webhook event
    getEventText(event) {
        if (event.message) {
            if (event.message.quick_reply && event.message.quick_reply.payload) {
                return event.message.quick_reply.payload;
            }

            if (event.message.text) {
                return event.message.text;
            }
        }

        if (event.postback && event.postback.payload) {
            return event.postback.payload;
        }

        return null;

    }

    getFacebookEvent(event) {
        if (event.postback && event.postback.payload) {

            let payload = event.postback.payload;

            switch (payload) {
                case FACEBOOK_WELCOME:
                    return {name: FACEBOOK_WELCOME};

                case FACEBOOK_LOCATION:
                    return {name: FACEBOOK_LOCATION, data: event.postback.data}
            }
        }

        return null;
    }

    processFacebookEvent(event) {
        const sender = event.sender.id.toString();
        const eventObject = this.getFacebookEvent(event);

        if (eventObject) {

            // Handle a text message from this sender
            if (!this.sessionIds.has(sender)) {
                this.sessionIds.set(sender, uuid.v4());
            }

            let apiaiRequest = this.apiAiService.eventRequest(eventObject,
                {
                    sessionId: this.sessionIds.get(sender),
                    originalRequest: {
                        data: event,
                        source: "facebook"
                    }
                });
            this.doApiAiRequest(apiaiRequest, sender);
        }
    }

    processMessageEvent(event) {
        const sender = event.sender.id.toString();
        const text = this.getEventText(event);

        if (text) {

            // Handle a text message from this sender
            if (!this.sessionIds.has(sender)) {
                this.sessionIds.set(sender, uuid.v4());
            }

            console.log("Text", text);
            //send user's text to api.ai service
            let apiaiRequest = this.apiAiService.textRequest(text,
                {
                    sessionId: this.sessionIds.get(sender),
                    originalRequest: {
                        data: event,
                        source: "facebook"
                    }
                });

            this.doApiAiRequest(apiaiRequest, sender);
        }
    }

    doApiAiRequest(apiaiRequest, sender) {
        apiaiRequest.on('response', (response) => {
            console.log('doApiAiRequest',response.result.metadata.intentName)
            console.log('doApiAiRequest', this.isDefined(response.result.metadata.intentName))

            if (this.isDefined(response.result) && this.isDefined(response.result.fulfillment)) {
                let responseData = response.result.fulfillment.data;
                let responseMessages = response.result.fulfillment.messages;
                /**
                 *      response.result.metadata.intentName
                 *              Default Fallback Intent
                 *              Default Welcome Intent
                 *              eventsToCome
                 */
                let responseText = response.result.fulfillment.speech;

                if (this.isDefined(responseData) && this.isDefined(responseData.facebook)) {
                    let facebookResponseData = responseData.facebook;
                    console.log('facebookResponseData', facebookResponseData)
                    this.doDataResponse(sender, facebookResponseData);
                } else if(this.isDefined(response.result.metadata.intentName)){
                    console.log("tryyyyyyyyyy")
                    bot.beginDialog('help')
                } else if (this.isDefined(responseMessages) && responseMessages.length > 0) {
                    console.log('responseMessages', responseMessages)
                    this.doRichContentResponse(sender, responseMessages);
                }
                else if (this.isDefined(responseText)) {
                    console.log('responseText', responseText)
                    this.doTextResponse(sender, responseText);
                }

            }
        });

        apiaiRequest.on('error', (error) => console.error(error));
        apiaiRequest.end();
    }

    splitResponse(str) {
        if (str.length <= FB_TEXT_LIMIT) {
            return [str];
        }

        return this.chunkString(str, FB_TEXT_LIMIT);
    }

    chunkString(s, len) {
        let curr = len, prev = 0;

        let output = [];

        while (s[curr]) {
            if (s[curr++] == ' ') {
                output.push(s.substring(prev, curr));
                prev = curr;
                curr += len;
            }
            else {
                let currReverse = curr;
                do {
                    if (s.substring(currReverse - 1, currReverse) == ' ') {
                        output.push(s.substring(prev, currReverse));
                        prev = currReverse;
                        curr = currReverse + len;
                        break;
                    }
                    currReverse--;
                } while (currReverse > prev)
            }
        }
        output.push(s.substr(prev));
        return output;
    }

    sendFBMessage(sender, messageData) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {access_token: FB_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: {
                    recipient: {id: sender},
                    message: messageData
                }
            }, (error, response) => {
                if (error) {
                    console.log('Error sending message: ', error);
                    reject(error);
                } else if (response.body.error) {
                    console.log('Error: ', response.body.error);
                    reject(new Error(response.body.error));
                }

                resolve();
            });
        });
    }

    sendFBSenderAction(sender, action) {
        return new Promise((resolve, reject) => {
            request({
                url: 'https://graph.facebook.com/v2.6/me/messages',
                qs: {access_token: FB_PAGE_ACCESS_TOKEN},
                method: 'POST',
                json: {
                    recipient: {id: sender},
                    sender_action: action
                }
            }, (error, response) => {
                if (error) {
                    console.error('Error sending action: ', error);
                    reject(error);
                } else if (response.body.error) {
                    console.error('Error: ', response.body.error);
                    reject(new Error(response.body.error));
                }

                resolve();
            });
        });
    }

    doSubscribeRequest() {
        request({
                method: 'POST',
                uri: `https://graph.facebook.com/v2.6/me/subscribed_apps?access_token=${FB_PAGE_ACCESS_TOKEN}`
            },
            (error, response, body) => {
                if (error) {
                    console.error('Error while subscription: ', error);
                } else {
                    console.log('Subscription result: ', response.body);
                }
            });
    }

    configureGetStartedEvent() {
        request({
                method: 'POST',
                uri: `https://graph.facebook.com/v2.6/me/thread_settings?access_token=${FB_PAGE_ACCESS_TOKEN}`,
                json: {
                    setting_type: "call_to_actions",
                    thread_state: "new_thread",
                    call_to_actions: [
                        {
                            payload: FACEBOOK_WELCOME
                        }
                    ]
                }
            },
            (error, response, body) => {
                if (error) {
                    console.error('Error while subscription', error);
                } else {
                    console.log('Subscription result', response.body);
                }
            });
    }

    isDefined(obj) {
        if (typeof obj == 'undefined') {
            return false;
        }

        if (!obj) {
            return false;
        }

        return obj != null;
    }

    sleep(delay) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(), delay);
        });
    }

}


let facebookBot = new FacebookBot();

server.use(bodyParser.text({type: 'application/json'}));

// Setup Restify Server
//const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || config.defaultPort, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// Server index page
server.get('/', function (req, res) {
    res.send('Deployed!');
    console.log("app", {
        appId: process.env.APP_ID,
        appPassword: process.env.APP_SECRET
    })
});

server.get('/api/messages', (req, res) => {
    if (req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);

        setTimeout(() => {
            facebookBot.doSubscribeRequest();
        }, 3000);
    } else {
        res.send('Error, wrong validation token');
    }
});

/**
 * Open an url
 */
// server.post('/api/messages', connector.listen());
// server.post('/ai', connector.listen());

server.post('/api/messages', (req, res) => {
    try {
        const data = JSONbig.parse(req.body);

        if (data.entry) {
            let entries = data.entry;
            entries.forEach((entry) => {
                console.log('entry webhook', entry)
                let messaging_events = entry.messaging;
                if (messaging_events) {
                    messaging_events.forEach((event) => {
                        if (event.message && !event.message.is_echo) {

                            if (event.message.attachments) {
                                let locations = event.message.attachments.filter(a => a.type === "location");

                                // delete all locations from original message
                                event.message.attachments = event.message.attachments.filter(a => a.type !== "location");

                                if (locations.length > 0) {
                                    locations.forEach(l => {
                                        let locationEvent = {
                                            sender: event.sender,
                                            postback: {
                                                payload: "FACEBOOK_LOCATION",
                                                data: l.payload.coordinates
                                            }
                                        };
                                        console.log("processs webhook event 1", locationEvent)
                                        facebookBot.processFacebookEvent(locationEvent);
                                    });
                                }
                            }
                            console.log("processs webhook event 2", event)
                            facebookBot.processMessageEvent(event);
                        } else if (event.postback && event.postback.payload) {
                            if (event.postback.payload === "FACEBOOK_WELCOME") {
                                console.log("processs webhook event 3", event)
                                facebookBot.processFacebookEvent(event);
                            } else {
                                console.log("processs webhook event 4", event)
                                facebookBot.processMessageEvent(event);
                            }
                        }
                    });
                }
            });
        }

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        console.log('errrr', err)
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});
server.post('/ai', (req, res) => {
    try {
        const data = JSONbig.parse(req.body);

        if (data.entry) {
            let entries = data.entry;
            entries.forEach((entry) => {
                console.log('entry webhook', entry)
                let messaging_events = entry.messaging;
                if (messaging_events) {
                    messaging_events.forEach((event) => {
                        if (event.message && !event.message.is_echo) {

                            if (event.message.attachments) {
                                let locations = event.message.attachments.filter(a => a.type === "location");

                                // delete all locations from original message
                                event.message.attachments = event.message.attachments.filter(a => a.type !== "location");

                                if (locations.length > 0) {
                                    locations.forEach(l => {
                                        let locationEvent = {
                                            sender: event.sender,
                                            postback: {
                                                payload: "FACEBOOK_LOCATION",
                                                data: l.payload.coordinates
                                            }
                                        };
                                        console.log("processs webhook event 1", locationEvent)
                                        facebookBot.processFacebookEvent(locationEvent);
                                    });
                                }
                            }
                            console.log("processs webhook event 2", event)
                            facebookBot.processMessageEvent(event);
                        } else if (event.postback && event.postback.payload) {
                            if (event.postback.payload === "FACEBOOK_WELCOME") {
                                console.log("processs webhook event 3", event)
                                facebookBot.processFacebookEvent(event);
                            } else {
                                console.log("processs webhook event 4", event)
                                facebookBot.processMessageEvent(event);
                            }
                        }
                    });
                }
            });
        }

        return res.status(200).json({
            status: "ok"
        });
    } catch (err) {
        console.log('errrr', err)
        return res.status(400).json({
            status: "error",
            error: err
        });
    }
});


/**
 *  Default intent
 */
intents.onDefault((session, args) => {
    console.log(args);
    // help trad
    session.endDialog('I didn\'t understand, if you need some help type just \'help\'');
});

intents.matches('eventsToCome', [
    (session, args, next) => {
        dialogs.askWhichNextEventDialog(session, args, next);
    },
    (session, args, next) => {
        if (args.response.entity === 'Team') {
            session.beginDialog('globalNextTeamEvent');
        } else {
            session.beginDialog('globalNextCompetitionEvent');
        }
    }
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);
intents.matches('eventsPassed', [
    (session, args, next) => {
        dialogs.askWhichLastEventDialog(session, args, next);
    },
    (session, args, next) => {
        if (args.response.entity === 'Team') {
            session.beginDialog('globalLastTeamEvent');
        } else {
            session.beginDialog('globalLastCompetitionEvent');
        }
    }
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);

intents.matches('getDetails', [
    (session, args, next) => {
        dialogs.askWhichGetDetailsDialog(session, args, next);
    },
    (session, args, next) => {
        if (args.response.entity === 'Team') {
            session.beginDialog('globalGetTeamDetailEvent');
        } else {
            session.beginDialog('globalGetPlayerDetailEvent');
        }
    }
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);

intents.matches('getPlayers', [
    (session, results, next) => {
        dialogs.askTeamPlayersDialog(session, results, next);
    },
    (session, results, next) => {
        dialogs.allPlayersFromTeamNameDialog(session, results, next);
    },
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);

intents.matches('help', [
    (session, results, next) => {
        dialogs.helpDialog(session, results, next);
    }
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);

intents.matches('getTable', [
    (session, results, next) => {
        dialogs.askCountryTableDialog(session, results, next);
    },
    (session, args, next) => {
        dialogs.askLeagueTableByCountryNameDialog(session, args, next);
    },
    (session, args, next) => {
        dialogs.getTableByLeagueIdDialog(session, args, next);
    },
]).reloadAction('startOver', 'Ok, starting over.',
    startOverConversation
).endConversationAction(
    'endAsk', 'Ok. It\'s done.',
    cancelConversation
);

