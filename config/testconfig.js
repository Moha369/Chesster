// NOTE: Neither of these files are committed and for good reason.
//       You must provide your own.
var slack_token = require("./slack_token.js").token;
var heltour_token = require("./heltour_token.js").token;


const UNSTABLE_BOT_ID = "C0VCCPMJ8";
const UNSTABLE_BOT_LONEWOLF_ID = "C0XQM31SL";
const UNSTABLE_BOT_ZHTEAM_ID = "C0XQM31SL";

var config = require("./config.js");
config['watcherBaseURL'] = "https://en.stage.lichess.org/api/stream/games-by-users"
config['slack_tokens']['chesster'] = slack_token;
config['winston']['channel'] = "#modster-logging"; 
config['winston']['handleExceptions'] = false;

config["welcome"]["channel"] = "dev-testing-lonewolf";

config["heltour"]["token"] = heltour_token;
config["heltour"]["baseEndpoint"] = "https://zh.lakin.ca/api/";
config["leagues"]["45+45"]["heltour"]["token"] = heltour_token;
config["leagues"]["45+45"]["heltour"]["baseEndpoint"] = "https://zh.lakin.ca/api/";
config["leagues"]["lonewolf"]["heltour"]["token"] = heltour_token;
config["leagues"]["lonewolf"]["heltour"]["baseEndpoint"] = "https://zh.lakin.ca/api/";

config["leagues"]["zhteam"]["heltour"]["token"] = heltour_token;
config["leagues"]["zhteam"]["heltour"]["baseEndpoint"] = "https://zh.lakin.ca/api/";

config["leagues"]["45+45"]["scheduling"]["channel"] = "dev-testing";
config["leagues"]["45+45"]["results"]["channel"] = "dev-testing";
config["leagues"]["45+45"]["results"]["channel_id"] = UNSTABLE_BOT_ID;
config["leagues"]["45+45"]["gamelinks"]["channel"] = "dev-testing";
config["leagues"]["45+45"]["gamelinks"]["channel_id"] = UNSTABLE_BOT_ID;
config["leagues"]["45+45"]["alternate"]["channel_id"] = UNSTABLE_BOT_ID;
config["leagues"]["lonewolf"]["scheduling"]["channel"] = "dev-testing-lonewolf";
config["leagues"]["lonewolf"]["results"]["channel"] = "dev-testing-lonewolf";
config["leagues"]["lonewolf"]["results"]["channel_id"] = UNSTABLE_BOT_LONEWOLF_ID;
config["leagues"]["lonewolf"]["gamelinks"]["channel"] = "dev-testing-lonewolf";
config["leagues"]["lonewolf"]["gamelinks"]["channel_id"] = UNSTABLE_BOT_LONEWOLF_ID;

config["leagues"]["zhteam"]["scheduling"]["channel"] = "dev-testing-crazyhouse";
config["leagues"]["zhteam"]["results"]["channel"] = "dev-testing-crazyhouse";
config["leagues"]["zhteam"]["results"]["channel_id"] = UNSTABLE_BOT_ZHTEAM_ID;
config["leagues"]["zhteam"]["gamelinks"]["channel"] = "dev-testing-crazyhouse";
config["leagues"]["zhteam"]["gamelinks"]["channel_id"] = UNSTABLE_BOT_ZHTEAM_ID;

config["channel_map"]["dev-testing"] = "45+45";
config["channel_map"][UNSTABLE_BOT_ID] = "45+45";
config["channel_map"]["unstable_bot-lonewolf"] = "lonewolf";
config["channel_map"][UNSTABLE_BOT_LONEWOLF_ID] = "lonewolf";

config["channel_map"]["dev-testing-lonewolf"] = "zhteam";
config["channel_map"][UNSTABLE_BOT_ZHTEAM_ID] = "zhteam";

config["messageForwarding"]["channel"] = "N/A";

module.exports = config;
