//------------------------------------------------------------------------------
// Watcher uses the game-stream API from Lichess to listen for games as they
// start and end.
//------------------------------------------------------------------------------
const _ = require('lodash');
const _https = require('https');
const url = require("url");
const winston = require("winston");
const moment = require("moment-timezone");
const format = require('string-format');
format.extend(String.prototype);
const _league = require("./league.js");
const games = require('./commands/games.js');
const heltour = require('./heltour.js');
const lichessApi = require('./lichess-api.js')();
const subscription = require('./commands/subscription.js')
const scheduling = require('./commands/scheduling.js')
const jst = require('./debug.js').jst;

const BACKOFF_TIMEOUT = 10;
const CREATED = 10;
const STARTED = 20;
const ABORTED = 25;
const MATE = 30;
const RESIGN = 31;
const STALEMATE = 32;
const TIMEOUT = 33;
const DRAW = 34;
const OUT_OF_TIME = 35;
const CHEAT = 36;
const NO_START = 37;
const UNKNOWN_FINISH = 38;
const VARIANT_END = 60;
const NORMAL_TERMINATION = [MATE, RESIGN, OUT_OF_TIME, DRAW, STALEMATE]

//------------------------------------------------------------------------------
function Watcher(bot, league) {
    var self = this;
    self.league = league;
    self.bot = bot;
    self.req = null;
    self.usernames = [];

    self.league.onRefreshPairings(function() {
        var white = _.map(league._pairings, "white");
        var black = _.map(league._pairings, "black");
        var newUsernames = _.uniq(_.concat(white, black));
        newUsernames.sort();
        var union = _.union(newUsernames, self.usernames);
        if (self.usernames.length - union.length !== 0) {
            winston.info("[Watcher] {}: {} old usernames {} incoming usernames {} differences".format(
                self.league.options.name,
                self.usernames.length,
                newUsernames.length,
                self.usernames.length - union.length
            ));
            winston.info("[Watcher] {}: Restarting because usernames have changed".format(self.league.options.name));
            self.usernames = newUsernames;
            self.watch();
        }
    });

    self.log = {
        error: message => winston.error(`[Watcher] ${self.league.options.name}: ${message}`),
        warn: message => winston.warn(`[Watcher] ${self.league.options.name}: ${message}`),
        info: message => winston.info(`[Watcher] ${self.league.options.name}: ${message}`),
        debug: message => winston.debug(`[Watcher] ${self.league.options.name}: ${message}`),
    };

    self.updatePairing = (pairing, body) => {
        return heltour.updatePairing(self.league.options.heltour, [pairing], body).then((response) => {
            if(response.error) {
                throw error;
            }
            return response.pairings[0];
        });
    };

    self.bindGame = (game, pairing) => {
        self.log.info(`Assigning game ${game.id} to pairing ${pairing.id}`);
        // Fetch the game details from the lichess games API because updateGamelink is more picky about the details format
        // This could be obviated by an enhancement to the game-stream API
        return self.updatePairing(pairing, {game: game})
            .then((response) => {
                self.bot.say({
                    text: `<@${pairing.white}> vs <@${pairing.black}>: <${lichessApi.gameIdToLink(game.id)}>`,
                    channel: self.league.options.gamelinks.channel_id,
                    attachments: [] // Needed to activate link parsing in the message
                });
                subscription.emitter.emit('a-game-starts',
                    self.league,
                    [game.white.name, game.black.name],
                    {
                        'result': result,
                        'white': game.white,
                        'black': game.black,
                        'leagueName': self.league.options.name
                    }
                );

            })
            .catch((e) => {
                self.log.error("Error assigning game_link to pairing: " + e);
            });
    };

    self.bindResult = (game, pairing, result) => {
        return self.updatePairing(pairing, {result: result}).then((response) => {
            self.bot.say({
                text: `<@${pairing.white}> ${result} <@${pairing.black}>`,
                channel: self.league.options.results.channel_id
            });
            subscription.emitter.emit('a-game-is-over',
                self.league,
                [pairing.white, pairing.black],
                {
                    'result': result,
                    'white': game.white,
                    'black': game.black,
                    'leagueName': self.league.options.name
                }
            );
        })
        .catch((e) => {
            self.log.error("Error trying to save result: " + e);
            throw e;
        });
    };


    self.warnClose = (warnings, white, black) => {
        self.log.info("Sending warning");
        [`<@${white}>,  <@${black}>: Your game is *not valid* because:\n` +
            warnings.join('\n'),
            "If this was a mistake, please correct it and " +
            "try again. If this is not a league game, you " +
            "may ignore this message. Thank you."
        ].forEach((text) => {
            self.bot.say({
                text: text,
                channel: self.league.options.gamelinks.channel_id
            });
        });
        heltour.sendGameWarning(league.options.heltour, white, black, warnings).catch(function(error) {
            winston.error("[Watcher] {}: Error sending game warning: {}".format(self.league.options.name, jst(error)));
        });
    };

    self.warnWrongTime = (game, pairing) => {
        self.log.info(`Game being played at wrong time: ${jst(game)}`)
        self.bot.say({
            text: `<@${pairing.white}>,  <@${pairing.black}>: ` +
            "Registering game even though it's not being played at the scheduled time. " +
            "If this is an error please contact a mod.",
            channel: self.league.options.gamelinks.channel_id
        });
    };

    self.ignore = game => self.log.info(`ignoring game: ${jst(game)}`);

    self.processNewGame = (game) => {
        const white = game.players.white.userId;
        const black = game.players.black.userId;
        let pairings = league.findPairing(white, black);

        if (!pairings.length) {
            self.log("No pairing so ignoring!");
            return;
        }

        const markers = [
            {
                test: pairing => white === pairing.white && black === pairing.black,
                label: "correctColors"
            },
            {
                test: (pairing) => {
                    if(!pairing.datetime) return false;
                    const date = moment.utc(pairing.datetime)
                    const now = moment.utc();
                    const hours = Math.abs(now.diff(date, 'hours'));
                    return hours <= 2;
                },
                label: "correctScheduledTime"
            },
            {
                test: (pairing) => {
                    if( !game.clock ) return false;
                    return game.clock.initial === pairing.clock.initial * 60&& // initial time
                        game.clock.increment === pairing.clock.increment; // increment
                },
                label: "correctTimeControl"
            },
            {
                test: pairing => _.toLower(pairing.white) === black,
                label: "colorsReversed"
            },
            {
                test: pairing => game.rated === pairing.rated,
                label: "correctRatingType"
            },
            {
                test: pairing => game.variant === pairing.variant,
                label: "correctVariantType"
            },
            {
                test: pairing => pairing.result && game.status === STARTED,
                label: "hasResult"
            },
            {
                test: pairing => pairing.game_link && !pairing.game_link.endsWith(game.id),
                label: "hasGameLink"
            },
            {
                test: pairing => pairing.game_link && !pairing.game_link.endsWith(game.id),
                label: "hasIncorrectGameLink"
            }
        ];


        const gameLinkValidations = [
            {
                test: (detials) => {
                    const extrema = scheduling.getRoundExtrema(self.league.options.gamelinks);
                    const game_start = moment.utc(game.createdAt);
                    return game_start.isBefore(extrema.start) || game_start.isAfter(extrema.end);
                },
                label: "gamePlayedOutOfRound",
                value: "the game was not played in the current round."
                //the link is too old or too new
            },
            {
                test: game => game.status === TIMEOUT,
                label: "victoryClaimed",
                value: "using \"Claim Victory\" is not permitted. Contact a mod."
            },
            {
                test: game => _.isEqual(game.status, CHEAT),
                lable: "cheatDetected",
                value: "The game ended with a \"Cheat Detected\". Contact a mod."
            }
        ];

        // Some preprocessing to get info used for decision making logic below
        const gameLinkValidationErrors = validate(game, gameLinkValidations);
        const markedPairings = mark(pairings, markers);

        // First find a perfect match and if we do we're done
        const perfectMatch = markedPairings.filter((markedPairing) => {
            const marks = markedPairing.marks;
            return  marks.correctColors &&
                marks.correctTimeControl &&
                marks.correctRatingType &&
                marks.correctVariantType &&
                !marks.hasResult &&
                !marks.hasIncorrectGameLink;
        });

        if(perfectMatch.length) {
            const match = perfectMatch[0];
            const pairing = match.obj;
            if(gameLinkValidationErrors.length) {
                const warnings = gameLinkValidationErrors.map(err => err.value );
                return self.warnClose(warnings, white, black);
            }
            if(!match.marks.correctScheduledTime) {
                self.warnWrongTime(game, pairing);
            }
            return self.bindGame(game, pairing);
        }

        // No match found so now we look for close matches and decide whether
        // to issue a warning
        const closeMatches = markedPairings.filter((markedPairing) => {
            const marks = markedPairing.marks;
            return (marks.correctColors || marks.colorsReversed) &&
                marks.correctScheduledTime;
        }).sort(e => !e.marks.correctColors);

        if(closeMatches.length) {
            const closest = closeMatches[0];
            const pairing = closest.obj;
            let warnings = [
                [marks => !marks.correctTimeControl, "The time control is incorrect."],
                [marks => marks.colorsReversed, "The colors are reversed."],
                [marks => !marks.correctRatingType, "The game is " + ( pairing.rated ? "unrated." : "rated." )],
                [marks => !marks.correctVariantType, "The variant should be " + pairing.variant],
                [marks => marks.hasResult, "There is already a result set for this pairing. If you want " +
                    "the new game to count for the league, please contact a mod."],
                [marks => marks.hasIncorrectGameLink, "Find message for this in git somewhere"]]
                .filter(warning => warning[0](closest.marks))
                .map(warning => warning[1]);
            warnings = warnings.concat(gameLinkValidationErrors.map(err => err.value ));
            return self.warnClose(warnings, white, black);
        }
        // If no match and no game that lookes like a failed attempt to play a
        // league game then we simply ignore the game and log it
        self.ignore(game);
    };

    self.processResult = (pairing, game) => {
        if(game.status === ABORTED) {
            return self.updatePairing(pairing, {game_link: ""}).then((response) => {
                self.log.info(`Game aborted ${jst(game)}`)
            }).catch((err) => {
                self.log.error(err);
            });
        }

        if(game.status === TIMEOUT) {
            self.log.info(`Game terminated by claim victory or claim draw: ${jst(game)}`);

            return self.bot.say({
                text: `<@${pairing.white}> <@${pairing.black}> Claim Victory/Draw is ` +
                `not allowed.  Please contact a mod\n<${pairing.game_link}>`,
                channel: self.league.options.gamelinks.channel_id,
                attachments: [] // Needed to activate link parsing in the message
            });
        }

        const parseResult = (game) => {
            if(game.winner === "black"){
                return "0-1";
            }
            if(game.winner === "white"){
                return "1-0";
            }
            return "1/2-1/2";
        };

        if(NORMAL_TERMINATION.includes(game.status)) {
            return lichessApi.game(game.id).then(parseResult).then((result) => {
                return self.bindResult(result, pairing);
            });
        }
        self.log.info(`Game result abnormal: ${jst(game)}`);
    };

    //--------------------------------------------------------------------------
    self.processGameDetails = function (game) {
        // 1. If game id matches a pairings game_link then assume this the termination
        // of that game.
        // 2. If game id does not match then check if it meets the criteria of a
        // possible pairing

        const allPairings = league._pairings;
        const pairing = allPairings.find(pairing => pairing.game_id === game.id)
        if(pairing) {
            return self.processResult(pairing, game)
        }

        return self.processNewGame(game)
    };

    //--------------------------------------------------------------------------
    self.watch = function() {
        // Ensure we close/abort any previous request before starting a new one.
        if (self.req) {
            self.req.abort();
            self.req = null;
            return; // The .on('end') handler will restart us.
        }

        // Guard against hammering lichess when it's down and feeding us errors.
        // In this case, if we get two errors in 10s, we'll wait till the next
        // refressh which will eventually wait 2 minutes between requests.
        self.lastStarted = self.started;
        self.started = moment.utc();
        if (self.lastStarted && self.started.unix() - self.lastStarted.unix() < BACKOFF_TIMEOUT) {
            const backoff = self.started.unix() - self.lastStarted.unix();
            self.log.warn(`Backing off the watcher due to two starts in 10s: ${backoff}s`);
            self.usernames = [];
            return;
        }
        var body = self.usernames.join(",");
        self.log.info(`Watching ${self.bot.config.watcherBaseURL} with ${body} users`);
        var options = url.parse(self.bot.config.watcherBaseURL);
        options.method = "POST";
        options.headers = {
            "Content-Length": Buffer.byteLength(body)
        };
        var hasResponse = false;
        self.req = _https.request(options);
        self.req.on('response', function (res) {
            res.on('data', function (chunk) {
                let details;
                try {
                    details = JSON.parse(chunk.toString());
                } catch (e) {
                    self.log.error(`Ending request due to error in content`);
                    self.log.error(e);
                    self.req.abort();
                    self.req = null;
                }
                self.log.info(`Received game details: ${jst(details)}`);
                self.league.refreshCurrentRoundSchedules()
                    .then((response) => {
                        return self.processGameDetails(details);
                    })
                    .catch((e) => {
                        self.log.error(`Error refreshing pairings: ${error}`);
                    });
            });
            res.on('end', () => {
                self.log.info("Watcher response ended");
                self.req = null;
                self.watch();
            });
            hasResponse = true;
        }).on('error', (e) => {
            self.log.error(e);
            // If we have a response, the above res.on('end') gets called even in this case.
            // So let the above restart the watcher
            if (!hasResponse) {
                self.req = null;
                self.watch();
            }
        });
        self.req.write(body);
        self.req.end();
    };
}


const validate = (obj, validations) => {
    return validations.filter((validation) => {
        return validation.test(obj);
    }).map((validation) => {
        return {
            label: validation.label,
            value: validation.value
        };
    });
}

const mark = (list, markers) => {
    return list.map((obj) => {
        marks = {};
        markers.forEach(marker => marks[marker.label] = marker.test(obj));
        return {obj: obj, marks: marks}
    })
};

var watcherMap = {};

//------------------------------------------------------------------------------
var watchAllLeagues = function(bot) {
    _.each(_league.getAllLeagues(bot, bot.config), function(league) {
        winston.info("[Watcher] {}: Watching".format(league.options.name));
        watcherMap[league.name] = new Watcher(bot, league);
    });
};

var getWatcher = function(league) {
    return watcherMap[league.name];
};

module.exports.watchAllLeagues = watchAllLeagues;
module.exports.getWatcher = getWatcher;
