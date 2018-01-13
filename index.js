const config = require('./config/config');
const dialogs = require('./dialogs/dialog');
const builder = require('botbuilder');
const restify = require('restify');
const apiairecognizer = require('api-ai-recognizer');
const footballProvider = require('./providers/footballProvider');

/**
 *  API.AI supports nearly 15 languages, but as the caution says:
 *  Caution: * Only one language per agent is supported.
 *  Language cannot be changed after creation of the agent.
 *  The NodeJS client doesn't permit this for now
 */
const frMessages = require('./lang/fr.json');
const enMessages = require('./lang/en.json');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || config.defaultPort, () => {
    console.log('%s listening to %s', server.name, server.url);
});

/**
 *  Create connector
 * @type {ChatConnector}
 */
const connector = new builder.ChatConnector({
    appId: process.env.APP_ID,
    appPassword: process.env.APP_SECRET
});


/**
 * Open an url
 */
server.post('/api/messages', connector.listen());

server.get('/webhook', (req, res) => {
    if (req.query["hub.verify_token"] === "this_is_my_token") {
        console.log("Verified webhook");
        res.status(200).send(req.query["hub.challenge"]);
    } else {
        console.error("Verification failed. The tokens do not match.");
        res.sendStatus(403);
    }
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
        if(args.response.entity === 'Team'){
            session.beginDialog('globalNextTeamEvent');
        }else{
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
        if(args.response.entity === 'Team'){
            session.beginDialog('globalLastTeamEvent');
        }else{
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
        if(args.response.entity === 'Team'){
            session.beginDialog('globalGetTeamDetailEvent');
        }else{
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

