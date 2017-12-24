const config = require('./config/config');
const dialogs = require('./dialogs/dialog');
const builder = require('botbuilder');
const restify = require('restify');
const apiairecognizer = require('api-ai-recognizer');
const request = require('request');

// Setup Restify Server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || config.defaultPort, function () {
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

/**
 * Entry point
 */
bot.dialog('/', intents);

/**
 *  Default intent
 */
intents.onDefault((session, args) => {
    console.log('args', args);
    console.log('reps', args.entities[0].entity);
    if (!args.entities[0].entity){
        session.send("Sorry...can you please rephrase?");
    }else{
        session.send(args.entities[0].entity);
    }

});