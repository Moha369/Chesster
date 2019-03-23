const rp = require('request-promise');
const jst = require('./debug.js').jst;
const url = require('url');

const base = 'https://lichess.org/';

const api = (config) => {
    return {
        game: (gameId) => {
            const uri = base + `api/game/${gameId}`;
            const options = {
                method: 'GET',
                uri: uri,
                json: true
            }
            return rp(options);
        },

        gameLinkToId: (gameLink) => {
            path = url.parse(gameLink).path;
            return path.substr(1);
        },

        gameIdToLink: (gameId) => {
            return base + gameId;
        }
    };
};

module.exports = api;
