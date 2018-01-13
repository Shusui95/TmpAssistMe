const config = require('./config/config');
const dialogs = require('./dialogs/dialog');
const bodyParser = require('body-parser');
const builder = require('botbuilder');
const server = require('express')();
const apiairecognizer = require('api-ai-recognizer');
const footballProvider = require('./providers/footballProvider');
const request = require('request');
const apiai = require('apiai');
const apiaiApp = apiai(config.apiaiApp);

server.use(bodyParser.urlencoded({extended: false}));
server.use(bodyParser.json());

/**
 *  API.AI supports nearly 15 languages, but as the caution says:
 *  Caution: * Only one language per agent is supported.
 *  Language cannot be changed after creation of the agent.
 *  The NodeJS client doesn't permit this for now
 */

// Setup Restify Server
//const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || config.defaultPort, () => {
    console.log('%s listening to %s', server.name, server.url);
});

// Server index page
server.get('/', function (req, res) {
    res.send('Deployed!');
});

server.get('/webhook', (req, res) => {
    console.log('Verified webhook', req.query['hub.verify_token'], process.env.VERIFY_TOKEN, req.query['hub.challenge']);
    if (req.query['hub.verify_token'] === process.env.VERIFICATION_TOKEN) {
        res.status(200).send(req.query['hub.challenge']);
    } else {
        res.status(403).send('Verification failed. The tokens do not match.');
    }
});

server.post('/ai', (req, res) => {
    sendMessage(senderId, "try 1")
    sendMessage(senderId, "try 2")
    console.log('focuuuuus', response);
    sendMessage(senderId, "success")
    if(response.result.action === 'input.unknown'){
        console.log('fiiirst', response.result.action,response.result.action === 'input.unknown')
        sendMessage(senderId, 'I didn\'t understand, if you need some help type just \'help\'')
    }else{
        if(response.result.metadata.intentName === null || response.result.metadata.intentName === 'Default Welcome Intent'){
            console.log("seeeecond", response.result.metadata.intentName)
            sendMessage(senderId, "timeout ?")
            sendMessage(senderId, response.result.fulfillment.speech)
        }else{
            console.log("thiiiiird", response.result.metadata.intentName)
            sendMessage(senderId, "timeout why dont send message ?")
            bot.beginDialog(response.result.metadata.intentName)
        }
    }
});

server.post('/query', (req, res) => {
    sendMessage(senderId, "try 1")
    sendMessage(senderId, "try 2")
    console.log('focuuuuus', response);
    sendMessage(senderId, "success")
    if(response.result.action === 'input.unknown'){
        console.log('fiiirst', response.result.action,response.result.action === 'input.unknown')
        sendMessage(senderId, 'I didn\'t understand, if you need some help type just \'help\'')
    }else{
        if(response.result.metadata.intentName === null || response.result.metadata.intentName === 'Default Welcome Intent'){
            console.log("seeeecond", response.result.metadata.intentName)
            sendMessage(senderId, "timeout ?")
            sendMessage(senderId, response.result.fulfillment.speech)
        }else{
            console.log("thiiiiird", response.result.metadata.intentName)
            sendMessage(senderId, "timeout why dont send message ?")
            bot.beginDialog(response.result.metadata.intentName)
        }
    }
});

// All callbacks for Messenger will be POST-ed here
server.post('/webhook', (req, res) => {
    // Make sure this is a page subscription
    console.log('body', req.body);
    console.log('entry', req.body.entry);
    if (req.body.object === 'page') {
        // Iterate over each entry
        // There may be multiple entries if batched
        req.body.entry.forEach((entry) => {
            // Iterate over each messaging event
            console.log('messaging', entry.messaging);
            entry.messaging.forEach((event) => {
                if (event.postback) {
                    processMessage(res, event);

                } else if (event.message) {
                    processMessage(res, event);

                }
            });
        });

    } else {
        console.log('req', req.body);
        res.sendStatus(200);

    }
});

function processMessage(res, event) {
    if (!event.message.is_echo) {
        let message = event.message;
        let senderId = event.sender.id;

        console.log('Received message from senderId: ' + senderId);
        console.log('Message is: ' + JSON.stringify(message));
        sendMessage(senderId, message.text)
        res.sendStatus(200)
        // You may get a text or attachment but not both
        if (message.text) {
            let formattedMsg = message.text.toLowerCase().trim();
            sendMessage(senderId, "try 1")
            sendMessage(senderId, "try 2")

            // let apiai = apiaiApp.textRequest(formattedMsg, {
            //     sessionId: 'tabby_cat'
            // });
            // apiai.on('response', (response) => {
            //     console.log('focuuuuus', response);
            //     sendMessage(senderId, "success")
            //     if(response.result.action === 'input.unknown'){
            //         console.log('fiiirst', response.result.action,response.result.action === 'input.unknown')
            //         sendMessage(senderId, 'I didn\'t understand, if you need some help type just \'help\'')
            //     }else{
            //         if(response.result.metadata.intentName === null || response.result.metadata.intentName === 'Default Welcome Intent'){
            //             console.log("seeeecond", response.result.metadata.intentName)
            //             sendMessage(senderId, "timeout ?")
            //             sendMessage(senderId, response.result.fulfillment.speech)
            //         }else{
            //             console.log("thiiiiird", response.result.metadata.intentName)
            //             sendMessage(senderId, "timeout why dont send message ?")
            //             bot.beginDialog(response.result.metadata.intentName)
            //         }
            //     }
            //     // hum
            //     // response.result.action === 'input.unknown'
            //     //      => response.result.metadata.intentId && intentName
            //     // ok
            //     // response.result.action === 'smalltalk.confirmation.yes'
            //     //      => response.result.fulfillment.speech
            //     //      => => response.result.metadata.intentId && intentName = null
            //     // next events
            //     //  response.result.action === 'france'
            //     //  => => response.result.metadata.intentId && intentName = eventsToCome
            // });
            //
            // apiai.on('error', (error) => {
            //     console.log(error);
            //     sendMessage(senderId, "error")
            //     sendMessage(senderId, error)
            // });
            //
            // apiai.end();

            // If we receive a text message, check to see if it matches any special
            // keywords and send back the corresponding movie detail.
            // Otherwise, search for new movie.

        } else if (message.attachments) {
            sendMessage(senderId, {text: 'Sorry, I don\'t understand your request.'});
        }
    }
}

// function processPostback(event) {
//     let senderId = event.sender.id;
//     let payload = event.postback.payload;
//
//     if (payload === "Greeting") {
//         // Get user's first name from the User Profile API
//         // and include it in the greeting
//         request({
//             url: "https://graph.facebook.com/v2.6/" + senderId,
//             qs: {
//                 access_token: process.env.PAGE_ACCESS_TOKEN,
//                 fields: "first_name"
//             },
//             method: "GET"
//         }, function(error, response, body) {
//             let greeting = "";
//             if (error) {
//                 console.log("Error getting user's name: " +  error);
//             } else {
//                 let bodyObj = JSON.parse(body);
//                 name = bodyObj.first_name;
//                 greeting = "Hi " + name + ". ";
//             }
//             let message = greeting + "My name is SP Movie Bot. I can tell you various details regarding movies. What movie would you like to know about?";
//             sendMessage(senderId, {text: message});
//         });
//     } else if (payload === "Correct") {
//         sendMessage(senderId, {text: "Awesome! What would you like to find out? Enter 'plot', 'date', 'runtime', 'director', 'cast' or 'rating' for the various details."});
//     } else if (payload === "Incorrect") {
//         sendMessage(senderId, {text: "Oops! Sorry about that. Try using the exact title of the movie"});
//     }
// }

// sends message to user
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending message: ' + response.error);
        }else{
            console.log('error send successful',error)
            console.log('response send successful',response)
            console.log('body send successful',body)
        }
    });
}

const connector = new builder.ChatConnector({});
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

/**
 *  Default intent
 */
intents.onDefault((session, args) => {
    console.log(args);
    // help trad
    session.endDialog('I didn\'t understand, if you need some help type just \'help\'');
});

bot.dialog('eventsToCome', [
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

