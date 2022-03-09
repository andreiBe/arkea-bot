//Requirements
import { Client } from "discord.js";
import config from "./config.json";
import schedule from "node-schedule";
import {
  getMenu,
  SetCWeekMenuURL,
  getEatingTime,
  toHoliday,
} from "./Functions.js";
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
  bot.user.setGame("Eating uunimakkara");
});

//Schedules, updates every day at 7:00AM. Fetches JSON file from Arkea website and extracts the information. Prints corresponding information for each day.
let j = schedule.scheduleJob("0 7 * * MON", async () => {
  config.guildIDs.forEach(async (val, i) => {
    let channel = bot.guilds.get(val).channels.get(config.menuChannelIDs[i]);
    let error = false;
    let result = await SetCWeekMenuURL(config.restaurantID).catch((e) => {
      error = true;
    });
    if (error || !channel) {
      if (channel) channel.send("Error opening arkeas page");
    }
    getMenu(result, channel);
  });
});

bot.on("message", async (message) => {
  let content = message.content.toLowerCase();
  if (content.length > 0 && content.substring(0, 1) == config.prefix) {
    let args = content.substring(1).split(" ");
    let cmd = args[0];

    //List of awailable commands
    switch (cmd) {
      //Random command, mainly for test purposes
      case "test":
        message.channel.send("Hello!");
        break;
      case "help":
        message.channel.send("Commands:");
        message.channel.send(config.prefix + "ruokalista");
        break;
      case "arkea":
        const guild = message.guild;
        if (!config.menuChannelIDs.includes(message.channel.id)) {
          config.menuChannelIDs.push(message.channel.id);
          config.guildIDs.push(message.guild.id);

          var jsonData = JSON.stringify(config);
          fs.writeFile("src/config.json", jsonData, function (err) {
            if (err) {
              console.log(err);
            }
          });
          message.channel.send("Registered arkea bot successfully");
        } else {
          message.channel.send("Arkea bot already registered for this channel");
        }
        break;
      case "dearkea":
        let index = config.menuChannelIDs.findIndex(
          (id) => id == message.channel.id
        );
        if (index != -1) {
          config.menuChannelIDs.splice(index, 1);
          config.guildIDs.splice(index, 1);
          var jsonData = JSON.stringify(config);
          fs.writeFile("src/config.json", jsonData, function (err) {
            if (err) {
              console.log(err);
            }
          });
          message.channel.send("Deregistered arkea bot successfully");
        } else {
          message.channel.send("This channel isn't registered");
        }
        break;

      case "ruokalista":
        let channel = message.channel;
        let error = false;
        let result = await SetCWeekMenuURL(config.restaurantID).catch((e) => {
          error = true;
        });
        if (!channel || error) {
          if (channel) channel.send("Error with opening arkeas page");
          break;
        }
        getMenu(result, channel);
        break;
      /*
      case "till":
        if (args[1]) message.channel.send(toHoliday()(args[1]));
        else message.channel.send(toHoliday()());
        break;
      case "time":
        let atmClass = args[1];
        let special = false;
        if (args[2] !== undefined && args[2] === "poikkeus") special = true;
        let time = "";
        if (special) time = getEatingTime(atmClass, specialData);
        else time = getEatingTime(atmClass, data);
        message.channel.send(time);
      */
    }
  }
});
/*
//To "star" message when star reaction is added
bot.on("messageReactionAdd", (reaction, user) => {
  if (reaction.emoji == "⭐" && reaction.message.guild)
    saveMessage(user, reaction);
});
*/
