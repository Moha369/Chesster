var token = require("./test_slack_token.js").token;
try {
    var test_chesster_slack_token = require("./test_chesster_slack_token.js").token;
} catch (e) {
    var test_chesster_slack_token = null;
}
var heltour_token = require("./test_heltour_token.js").token;

const CRAZYHOUSE_CHANNEL_ID = "CGSJNKN4A";
const CRAZYHOUSE_SCHEDULING_CHANNEL_ID = "CGRS2LED6";
const CRAZYHOUSE_GAMES_CHANNEL_ID = "CGSHF1BAQ";
const CRAZYHOUSE_ALTERNATES_CHANNEL_ID = "CGTPT0XCM";

var config = require('./crazyhouseconfig.js')

config['winston'] = {
        domain: "crazybot",
        channel: "#crazyhouse-logging",
        username: "crazybot",
        level: "debug",
        handleExceptions: false
    },

config["welcome"]["channel"] = "crazyhouse";

config["heltour"]["token"] = heltour_token;
config["heltour"]["baseEndpoint"] = "http://localhost:8000/api/";

config['slack_tokens']['chesster'] = test_chesster_slack_token;
config['slack_tokens']['lichess4545'] = test_chesster_slack_token;
config["leagues"]["zhteam"]["heltour"]["baseEndpoint"] = "http://localhost:8000/api/";
config["leagues"]["zhteam"]["heltour"]["token"] = heltour_token;

config["leagues"]["zhteam"]["scheduling"]["channel"] = "crazyhouse-scheduling";
config["leagues"]["zhteam"]["results"]["channel"] = "crazyhouse-games";
config["leagues"]["zhteam"]["results"]["channel_id"] = CRAZYHOUSE_GAMES_CHANNEL_ID;
config["leagues"]["zhteam"]["gamelinks"]["channel"] = "crazyhouse-games";
config["leagues"]["zhteam"]["gamelinks"]["channel_id"] = CRAZYHOUSE_GAMES_CHANNEL_ID;
config["leagues"]["zhteam"]["gamelinks"]["rated"] = false;
config["leagues"]["zhteam"]["alternate"]["channel_id"] = CRAZYHOUSE_ALTERNATES_CHANNEL_ID;

config["channel_map"][CRAZYHOUSE_CHANNEL_ID] = "zhteam";
config["channel_map"]["crazyhouse"] = "zhteam";


module.exports = config;
