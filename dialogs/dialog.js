const builder = require('botbuilder');
const footballProvider = require('../providers/footballProvider');

const dialogs = {
    helloWorldDialog: (session) => {
        console.log('sessssion', session)
        session.send('hello');
        session.endDialog();
    },
    askCountryCompetitionDialog: (session, args, next) => {
        footballProvider.allLeagues(result => {
            let countrys = [];
            let msg = '';
            for (country of result) {
                if (countrys.indexOf(country.strCountry) === -1) {
                    if (countrys.length < 1) {
                        msg += country.strCountry;
                    } else {
                        msg += '|' + country.strCountry;
                    }
                    countrys.push(country.strCountry);
                }
            }
            builder.Prompts.choice(
                session,
                `Which country do you want leagues :<br/>`,
                msg,
                {listStyle: builder.ListStyle.button}
            );
        });
    },
    askCountryTableDialog: (session, args, next) => {
        footballProvider.allLeagues(result => {
            let countrys = [];
            let msg = '';
            for (country of result) {
                if (countrys.indexOf(country.strCountry) === -1) {
                    if (countrys.length < 1) {
                        msg += country.strCountry;
                    } else {
                        msg += '|' + country.strCountry;
                    }
                    countrys.push(country.strCountry);
                }
            }
            builder.Prompts.choice(
                session,
                `Which country do you want table :<br/>`,
                msg,
                {listStyle: builder.ListStyle.button}
            );
        });
    },
    askLeagueByCountryNameDialog: (session, args, next) => {
        console.log('args', args);
        footballProvider.allLeaguesByCountryName(args.response.entity, result => {
            let msg = '';
            for (competition of result) {
                if (msg.length < 1) {
                    msg += competition.idLeague + '.' + competition.strLeague;
                } else {
                    msg += '|' + competition.idLeague + '.' + competition.strLeague;
                }

            }
            builder.Prompts.choice(
                session,
                `Which league do you want next events :<br/>`,
                msg,
                {listStyle: builder.ListStyle.button}
            );
        });
    },
    askLeagueTableByCountryNameDialog: (session, args, next) => {
        console.log('args', args);
        footballProvider.allLeaguesByCountryName(args.response.entity, result => {
            let msg = '';
            for (competition of result) {
                if (msg.length < 1) {
                    msg += competition.idLeague + '.' + competition.strLeague;
                } else {
                    msg += '|' + competition.idLeague + '.' + competition.strLeague;
                }

            }
            builder.Prompts.choice(
                session,
                `Which league do you want next table :<br/>`,
                msg,
                {listStyle: builder.ListStyle.button}
            );
        });
    },
    helpDialog: (session, args, next) => {

            session.send("Hi ! I'm Football Contest chatbot. I can give you several informations on the football games : <br>");
            session.send("* 'next events' : give 5 next events for a team or 10 next events for a league <br>");
            session.send("* 'last events' : give 5 last events for a team or 10 last events for a league <br>");
            session.send("* 'get detail' : give team a team or a player detail  <br>");
            session.send("* 'get players' : give all players from a team <br>");
            session.send("* 'help' : give all players from a team <br>");
            session.send("<br>");
            session.send("You can interup dialog waterfall by typing 'cancel' <br>");
            session.send("or relaunch by typing 'start over' <br>");
            session.endDialog('');


    },
    askWhichNextEventDialog: (session, args, next) => {
        if (args.intent) {
            builder.Prompts.choice(
                session,
                `Which type of next events do you want :<br/>`,
                `Team|League`,
                {listStyle: builder.ListStyle.button}
            );
        } else {
            session.endDialog('Something went wrong with your intent');
        }

    },
    askWhichLastEventDialog: (session, args, next) => {
        if (args.intent) {
            builder.Prompts.choice(
                session,
                `Which type of last events do you want :<br/>`,
                `Team|League`,
                {listStyle: builder.ListStyle.button}
            );
        } else {
            session.endDialog('Something went wrong with your intent');
        }

    },
    askWhichGetDetailsDialog: (session, args, next) => {
        if (args.intent) {
            builder.Prompts.choice(
                session,
                `Which type of details do you want :<br/>`,
                `Player|Team`,
                {listStyle: builder.ListStyle.button}
            );
        } else {
            session.endDialog('Something went wrong with your intent');
        }

    },
    askTeamNextEventDialog: (session, args, next) => {
        console.log('args', args);
        builder.Prompts.text(session, 'Which team do you want the next event ?');
    },
    askTeamDetailsDialog: (session, args, next) => {
        console.log('args', args);
        builder.Prompts.text(session, 'Which team do you want details ?');
    },
    askPlayerDetailsDialog: (session, args, next) => {
        console.log('args', args);
        builder.Prompts.text(session, 'Which player do you want details ?');
    },
    askTeamLastEventDialog: (session, args, next) => {
        console.log('args', args);
        builder.Prompts.text(session, 'Which team do you want the last event ?');
    },
    askTeamPlayersDialog: (session, args, next) => {
        console.log('args', args);
        builder.Prompts.text(session, 'Which team do you want players list ?');
    },
    searchTeamByNameDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            footballProvider.searchTeamByName(results.response, result => {
                console.log('args', result);
                if (!result) {
                    session.send('Sorry...can you please rephrase?');
                } else {
                    let msg = '';
                    let flag = 0;
                    //session.dialogData.profile = args || {};
                    for (team of result) {
                        if (flag !== 0) {
                            msg += '|';
                        }
                        flag++;
                        msg += `${ team.idTeam }.`;
                        msg += `${ team.strTeam }`;
                        if (team.strAlternate && team.strAlternate.length > 1) {
                            msg += ` (${team.strAlternate})`;
                        }
                        msg += ` in ${team.strLeague}`;
                    }
                    // Todo :  check if msg is not empty, otherwise choice prompt is blocking
                    if (msg && msg.length > 1) {
                        builder.Prompts.choice(
                            session,
                            `There is the list of matched teams :<br/>Click on one of them`,
                            msg,
                            {listStyle: builder.ListStyle.button}
                        );
                    } else {
                        session.endDialog('We\'ve found any team name that match');
                    }
                }
            });
        } else {
            next();
        }
    },
    searchPlayerByNameDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            footballProvider.searchPlayerByName(results.response, result => {
                console.log('args', result);
                if (!result) {
                    session.send('Sorry...can you please rephrase?');
                } else {
                    let msg = '';
                    let flag = 0;
                    //session.dialogData.profile = args || {};
                    for (player of result) {
                        console.log('player', player);
                        if (flag !== 0) {
                            msg += '|';
                        }
                        flag++;
                        msg += `${ player.idPlayer }.`;
                        msg += `${ player.strPlayer }`;
                        msg += ` in ${player.strTeam}`;
                    }
                    // Todo :  check if msg is not empty, otherwise choice prompt is blocking
                    if (msg && msg.length > 1) {
                        builder.Prompts.choice(
                            session,
                            `There is the list of matched players :<br/>Click on one of them`,
                            msg,
                            {listStyle: builder.ListStyle.button}
                        );
                    } else {
                        session.endDialog('We\'ve found any team name that match');
                    }
                }
            });
        } else {
            next();
        }
    },
    next15EventsByLeagueIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idLeague = results.response.entity.split('.')[0];
            console.log('idleague', idLeague);
            footballProvider.getNext15EventsByLeagueId(idLeague, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No event was found for this league');
                } else {
                    for (event of result.slice(0, 10)) {
                        let msg = '';
                        msg += event.strLeague + ' J' + event.intRound + ' : ' + event.strEvent;
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    last15EventsByLeagueIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idLeague = results.response.entity.split('.')[0];
            console.log('idleague', idLeague);
            footballProvider.getLast15EventsByLeagueId(idLeague, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No event was found for this league');
                } else {
                    for (event of result.slice(0, 10)) {
                        let msg = '';
                        msg += event.strLeague + ' J' + event.intRound + ' : ' + event.strHomeTeam + ' ' + event.intHomeScore;
                        msg += ' - ' + event.intAwayScore + ' ' + event.strAwayTeam + ' \n\n';
                        if (event.intHomeScore > 0 || event.intAwayScore > 0) msg += ' \n\n';
                        if (event.intHomeScore > 0) {
                            msg += event.strHomeTeam + ' -> ' + event.strHomeGoalDetails.replace(';', ' ') + ' \n\n';
                        }
                        if (event.intAwayScore > 0) {
                            msg += event.strAwayTeam + ' -> ' + event.strAwayGoalDetails.replace(';', ' ') + ' \n\n';
                        }
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    getTableByLeagueIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idTeam = results.response.entity.split('.')[0];
            footballProvider.getTableByLeagueId(idTeam, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No table was found for this team');
                } else {
                    let msg = '';
                    let count = 1;
                    msg += 'Team | Pts | Played | Win | Draw | Loss | Diff <br>';
                    for (team of result) {
                        msg += count+'.'+team.name;
                        for(let i = team.name.length; i < 20; i++){
                            msg += ' &nbsp;';
                        }
                        msg += '&nbsp; | &nbsp;' + team.total + '&nbsp; | &nbsp;' + team.played + '&nbsp; | &nbsp;' + team.win + '&nbsp; | &nbsp;' + team.draw + '&nbsp; | &nbsp;' + team.loss + '&nbsp; | &nbsp;' + team.goalsdifference + '<br>';
                    }
                    session.send(msg);
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    getDetailsByTeamIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idTeam = results.response.entity.split('.')[0];
            footballProvider.getDetailTeamById(idTeam, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No detail was found for this team');
                } else {
                    for (team of result) {
                        let msg = '';
                        msg += team.strTeam + ' alias ' + team.strAlternate + ' in ' + team.strLeague + '\n\n';
                        msg += team.strTeam + ' is managed by ' + team.strManager + ' in ' + team.strStadium + '\n\n';
                        msg += 'Stadium : ' + team.strStadium + ' has a capacity of ' + team.intStadiumCapacity + ' and is located at ' + team.strStadiumLocation + '\n\n';
                        msg += 'Link : Website : ' + team.strWebsite + ';  Facebook : ' + team.strFacebook + ';  Twitter : ' + team.strTwitter + '\n\n';
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    getDetailsByPlayerIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idPlayer = results.response.entity.split('.')[0];
            console.log('id', idPlayer);
            footballProvider.searchPlayerById(idPlayer, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No detail was found for this player');
                } else {
                    for (player of result) {
                        let msg = '';
                        msg += player.strPlayer + ' was born in ' + player.dateBorn + ' in ' + player.strBirthLocation + '. Height : ' + player.strHeight + ' & Weight : ' + player.strWeight + '\n\n';
                        msg += player.strPlayer + ' plays for ' + player.strTeam + ' since ' + player.dateSigned + ' for ' + player.strSigning + ' and ' + player.strWage + ' salary.\n\n';
                        msg += player.strDescriptionEN + '\n\n';
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a player. Type \'start over\' to reload the dialog');
        }
    },
    allPlayersFromTeamNameDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            console.log('name', results.response);
            footballProvider.allPlayersFromTeamName(results.response, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No player was found for this team');
                } else {
                    let msg = '';
                    for (player of result) {

                        msg += player.strPosition + ' - ' + player.strPlayer + ' (' + player.strNationality + ') <br>';

                    }
                    session.send(msg);
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    next5EventsByTeamIdDialog: (session, results, next) => {
        console.log(results);
        if (results.response) {
            const idTeam = results.response.entity.split('.')[0];
            footballProvider.getNext5EventsByTeamId(idTeam, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No event was found for this team');
                } else {
                    for (event of result) {
                        let msg = '';
                        msg += event.strLeague + ' J' + event.intRound + ' : ' + event.strEvent;
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    },
    last5EventsByTeamIdDialog: (session, results, next) => {
        console.log('last', results);
        if (results.response) {
            const idTeam = results.response.entity.split('.')[0];
            footballProvider.getLast5EventsByTeamId(idTeam, result => {
                console.log('args', result);
                if (!result) {
                    session.send('No event was found for this team');
                } else {
                    for (event of result) {
                        let msg = '';
                        msg += event.strLeague + ' J' + event.intRound + ' : ' + event.strHomeTeam + ' ' + event.intHomeScore;
                        msg += ' - ' + event.intAwayScore + ' ' + event.strAwayTeam + ' \n\n';
                        if (event.intHomeScore > 0 || event.intAwayScore > 0) msg += ' \n\n';
                        if (event.intHomeScore > 0) {
                            msg += event.strHomeTeam + ' -> ' + event.strHomeGoalDetails.replace(';', ' ') + ' \n\n';
                        }
                        if (event.intAwayScore > 0) {
                            msg += event.strAwayTeam + ' -> ' + event.strAwayGoalDetails.replace(';', ' ') + ' \n\n';
                        }
                        session.send(msg);
                    }
                    session.endDialog('');
                }
            });
        } else {
            session.send('Please select a team. Type \'start over\' to reload the dialog');
        }
    }
};

module.exports = dialogs;