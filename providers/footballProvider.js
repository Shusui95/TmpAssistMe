const request = require('request');

const url = 'http://www.thesportsdb.com/api/v1/json/1';
const header = {json: true};

const footballProvider = {
    searchTeamByName(teamName, callback) {
        return request(url + '/searchteams.php?t=' + teamName, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.teams);
        });
    },
    allPlayersFromTeamName(teamName, callback) {
        return request(url + '/searchplayers.php?t=' + teamName, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.player);
        });
    },
    /**
     * @param countryName - be careful with lang : England, France etc
     * Need translate provider / file
     */
    allLeaguesByCountryName(countryName, callback) {
        return request(url + '/search_all_leagues.php?s=Soccer&c=' + countryName, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.countrys);
        });
    },
    allLeagues(callback) {
        //http://www.thesportsdb.com/api/v1/json/1/search_all_leagues.php?s=soccer
        return request(url + '/search_all_leagues.php?s=Soccer', header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.countrys);
        });
    },
    searchPlayerByName(playerName, callback) {
        return request(url + '/searchplayers.php?p=' + playerName, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.player);
        });
    },
    searchPlayerById(idPlayer, callback) {
        return request(url + '/lookupplayer.php?id=' + idPlayer, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.players);
        });
    },
    /**
     * @param eventName : Arsenal_vs_Chelsea for example
     * @param callback
     * @returns {*}
     */
    searchEventByEventName(eventName, callback) {
        return request(url + '/searchevents.php?e=' + eventName, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.event);
        });
    },
    /**
     * @param eventName : Arsenal_vs_Chelsea & 1718 for example
     * @param callback
     * @returns {*}
     */
    searchEventByEventNameAndSeason(eventName, season, callback) {
        return request(url + '/searchevents.php?e=' + eventName + '&s=' + season, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.event);
        });
    },
    getLeagueById(idLeague, callback) {
        return request(url + '/lookupleague.php?id=' + idLeague, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.leagues);
        });
    },
    getTeamById(idTeam, callback) {
        return request(url + '/lookupteam.php?id=' + idTeam, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.teams);
        });
    },
    getDetailEventById(idEvent, callback) {
        return request(url + '/lookupevent.php?id=' + idEvent, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.events);
        });
    },
    getDetailTeamById(idTeam, callback) {
        return request(url + '/lookupteam.php?id=' + idTeam, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.teams);
        });
    },
    getAllPlayersByTeamId(idTeam, callback) {
        return request(url + '/lookup_all_players.php?id=' + idTeam, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.player);
        });
    },
    /**
     * @param idLeague & 1718 for example
     * @param callback
     * @returns {*}
     */
    getTableByLeagueId(idLeague, callback) {
        console.log('test', url + '/lookuptable.php?l=' + idLeague + '&s=1718')
        return request(url + '/lookuptable.php?l=' + idLeague + '&s=1718', header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.table);
        });
    },
    getNext5EventsByTeamId(idTeam, callback) {
        return request(url + '/eventsnext.php?id='+idTeam, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.events);
        });
    },
    getNext15EventsByLeagueId(idLeague, callback) {
        return request(url + '/eventsnextleague.php?id='+idLeague, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.events);
        });
    },
    getLast5EventsByTeamId(idTeam, callback) {
        return request(url + '/eventslast.php?id='+idTeam, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            console.log('res', res)
            console.log('body', body)
            callback(body.results);
        });
    },
    getLast15EventsByLeagueId(idLeague, callback) {
        return request(url + '/eventspastleague.php?id='+idLeague, header, (err, res, body) => {
            if (err) return console.log('Error : ' + err);
            callback(body.events);
        });
    }

};

module.exports = footballProvider;