const config = require('./config/config');
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
const bot = new builder.UniversalBot(connector, session => {
    session.beginDialog('hello')
});

/**
 * Enable conversation data persistence
 */
bot.set('persistConversationData', true);



/**
 * Entry point
 */
bot.dialog('hello', session => {
    session.send("hello world");
    session.endDialog();
});