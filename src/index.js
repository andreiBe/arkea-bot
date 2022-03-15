//Requirements
import { Client } from "discord.js";
import config from "./config.json";
import schedule from "node-schedule";
import { getMenu, SetCWeekMenuURL, clearCache } from "./Functions.js";
/*
import { returnThisDay, ConvertToISO, saveMessage } from "./Utility.js";
import responses from "./responses.json";

import data from "../json/timetable.json";
import specialData from "../json/poikkeusTimetable.json";
import mongoose from "mongoose";
*/
// Needed for async to work
require("babel-core/register");
require("babel-polyfill");
var fs = require("fs");

const bot = new Client();

bot.login(config.token).catch((e) => {
  console.log(e);
});

const defaultGuild = function () {
  return {
    channels: [],
    restourantId:
      "https://masu.arkea.fi/fi/lounaslistat?restaurant=711af04e-e0d0-4e28-9a32-cacbe8504150",
  };
};
//Informs successful login to the console
bot.on("ready", () => {
  console.log("Connected");
  console.log(
    "Bot has started. Logged in as " +
      bot.user.username +
      ". Connected to " +
      bot.guilds.size +
      " servers"
  );
  bot.user.setActivity("ruokalistoja", { type: "WATCHING" });

  bot.guilds.forEach((guild) => {
    if (!(guild.id in config.guilds)) {
      config.guilds[guild.id] = defaultGuild();
    }
  });
  saveJson();
});
//joined a server
bot.on("guildCreate", (guild) => {
  if (!(guild.id in config.guilds)) {
    config.guilds[guild.id] = defaultGuild();
  }
  saveJson();
});

//removed from a server
bot.on("guildDelete", (guild) => {
  if (guild.id in config.guilds) {
    delete config.guilds[guild.id];
  }
  saveJson();
});

//* 7 * * MON
//Schedules, updates every day at 7:00AM. Fetches JSON file from Arkea website and extracts the information. Prints corresponding information for each day.
let j = schedule.scheduleJob("1 8 9 * * 1", async () => {
  clearCache();
  bot.guilds.forEach(async (guild) => {
    const gu = config.guilds[guild.id];

    gu.channels.forEach((ch) => {
      ruokalista(guild.channels.get(ch), gu.restourantId);
    });
  });
});
function help(message) {
  message.channel.send("Komennot (jokaisen edessä !):");
  message.channel.send("viikonlista, printtaa ruokalistan");
  message.channel.send("lisää, alkaa lähettämään ruokalistoja viikottain kanavalle");
  message.channel.send("poista, lopettaa viikoittaisten ruokalistojen lähettämisen");
}
function saveJson() {
  let success = true;
  var jsonData = JSON.stringify(config);
  fs.writeFile("src/config.json", jsonData, function (err) {
    if (err) {
      console.log(err);
      success = false;
    }
  });
  return success;
}
function activate(message) {
  const guild = config.guilds[message.guild.id];
  if (!guild.channels.includes(message.channel.id)) {
    guild.channels.push(message.channel.id);

    if (!saveJson()) message.channel.send("Error saving json!");
    else message.channel.send("Lähetetään ruokalistoja!");
  } else {
    message.channel.send("Botti on jo rekisteröity");
  }
}
function deactivate(message) {
  const guild = config.guilds[message.guild.id];
  if (guild.channels.includes(message.channel.id)) {
    guild.channels.splice(
      guild.channels.findIndex((c) => c == message.channel.id),
      1
    );

    if (!saveJson()) message.channel.send("Error saving json!");
    else message.channel.send("Ruokalistat viety kaappiin!");
  } else {
    message.channel.send("Tätä kanavaa ei ole rekisteröity");
  }
}
async function ruokalista(channel, restourantId) {
  let error = false;
  let result = await SetCWeekMenuURL(restourantId).catch((e) => {
    error = true;
  });
  if (!channel || error) {
    if (channel) channel.send("Error with opening arkeas page");
    return;
  }
  getMenu(result, channel);
}
bot.on("message", async (message) => {
  let content = message.content.toLowerCase();
  if (content.length > 0 && content.substring(0, 1) == config.prefix) {
    let args = content.substring(1).split(" ");
    let cmd = args[0];

    //List of awailable commands
    switch (cmd) {
      case "help":
        help(message);
        break;
      case "lisää":
        activate(message);
        break;
      case "poista":
        deactivate(message);
        break;
      case "viikonlista":
        let restourantId = config.guilds[message.guild.id].restourantId;
        ruokalista(message.channel, restourantId);
        break;
      case "vaihdaravintola":
        let path = args[1];
        const guild = message.guild;
        config.guilds[guild.id].restourantId = path;
        message.channel.send("Ravintola vaihdettu!");
    }
  }
});
