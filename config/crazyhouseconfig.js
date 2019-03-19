// NOTE: Neither of these files are committed and for good reason.
//       You must provide your own.
const slack_token = require("./slack_token.js").token;
const heltour_token = require("./heltour_token.js").token;


const CRAZYHOUSE_CHANNEL_ID = "CBAA5T16V";
const CRAZYHOUSE_GAMES_CHANNEL_ID = "CBAU4LBQA";
const CRAZYHOUSE_SCHEDULING_CHANNEL_ID = "CBB2XLZM3";
const CRAZYHOUSE_ALTERNATES_CHANNEL_ID = "CBAU4LBQA";
const CRAZYHOUSE_LOGGING_CHANNEL_ID = 'GH3QS73J7';

const INITIAL = 5;
const INCREMENT = 5;
var config = require("./config.js");
config["leagues"]["zhteam"] = {
            "name": "zhteam",
            "also_known_as": [
                "crazyhouse",
                "crazyhouseteam",
            ],
            "heltour": {
                "token": heltour_token,
                "baseEndpoint": "https://zh.lakin.ca/api/",
                "leagueTag": "zhteam"
            },
            "results": {
                "channel": "crazyhouse-games",
                "channel_id": CRAZYHOUSE_GAMES_CHANNEL_ID,
            },
            "gamelinks": {
                "channel": "crazyhouse-games",
                "channel_id": CRAZYHOUSE_GAMES_CHANNEL_ID,
                "clock": {
                    "initial": INITIAL,
                    "increment": INCREMENT
                },
                "rated": true,
                "variant" : "crazyhouse",
                "extrema": {
                    "iso_weekday": 1,
                    "hour": 11,
                    "minute": 0,
                    "warning_hours": 1
                }
            },
            "scheduling": {
                "extrema": {
                    "isoWeekday": 1,
                    "hour": 11,
                    "minute": 0,
                    "warningHours": 1
                },
                "warningMessage": "Hi! Glad you got your game scheduled. Be warned though - it's cutting it pretty close to deadline! Please be on time and prompt with your game time, the league depends on it! Thanks, and if you have any questions, please contact the moderators.",
                "lateMessage": "Hi! Sorry, that time you posted is not an acceptable time. We need all games to end by 12:00 GMT on Monday, and we believe if you start then, you won't be done then! Please try and find a better time, and if you cannot, please contact the moderators.",
                "format": "MM/DD @ HH:mm",
                "channel": "crazyhouse-scheduling",
                "channel_id": CRAZYHOUSE_SCHEDULING_CHANNEL_ID
            },
            "alternate": {
                "channel_id": CRAZYHOUSE_ALTERNATES_CHANNEL_ID
            },
            "links": {
                "faq": "http://zh.lakin.ca/zhteam/document/faq/",
                "rules": "https://zh.lakin.ca/zhteam/document/rules/",
                "league": "https://zh.lakin.ca/zhteam/",
                "pairings": "https://zh.lakin.ca/zhteam/pairings/",
                "standings": "https://zh.lakin.ca/zhteam/standings/",
                "guide": "https://zh.lakin.ca/zhteam/document/player-handbook/",
                "captains": "https://zh.lakin.ca/zhteam/document/captains/",
                "registration": "https://zh.lakin.ca/zhteam/register/",
                "availability": "https://zh.lakin.ca/zhteam/availability/edit/",
                "nominate": "https://zh.lakin.ca/zhteam/nominate/",
                "notifications": "https://zh.lakin.ca/zhteam/notifications/"
            }
        };


config["database"] = "chesster";
config["username"] = "chesster";
config["password"] = "scrappy pulpit gourde hinders";

config['watcherBaseURL'] = "https://lichess.org/api/stream/games-by-users"
config['slack_tokens']['chesster'] = slack_token;
config['winston'] = {
        domain: "crazybot",
        channel: "#crazyhouse-logging",
        username: "crazybot",
        level: "debug",
        handleExceptions: false
    };

config["welcome"]["channel"] = "crazyhouse";

config["heltour"]["token"] = heltour_token;
config["heltour"]["baseEndpoint"] = "https://zh.lakin.ca/api/";

delete config["leagues"]["45+45"];
delete config["leagues"]["lonewolf"];
delete config["leagues"]["blitzbattle"];
delete config["leagues"]["chess960"];

config["channel_map"] = {
        "crazyhouse": "zhteam",
        "crazyhouse-games": "zhteam",
        "crazyhouse-scheduling": "zhteam",
        "crazyhouse-alternates": "zhteam",
        "crazyhouse-mods": "zhteam"
    };

config["messageForwarding"]["channel"] = "N/A";

module.exports = config;
