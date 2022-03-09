import fetch from "isomorphic-fetch";

const days = ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai"];

//creates a discord field for the embedded message
function field(name, value) {
  return {
    name: name,
    value: value,
    inline: true,
  };
}

async function getMenu(data, channel) {
  //list that contains fields for discord api
  const list = [];
  days.forEach((day) => {
    list.push(field("Viikonpäivä", day));
    list.push(field("Lounas: ", data[day].liha));
    list.push(field("Kasvislounas: ", data[day].kasvis));
  });
  //Send embbed message
  channel.send({
    embed: {
      color: 0x3fc77, //vihreä
      timestamp: new Date(),
      footer: {
        //arkea icon
        icon_url:
          "https://pbs.twimg.com/profile_images/441542471760097280/9sDmsLIm_400x400.jpeg",
        text: "Ruokalista",
      },
      fields: list,
    },
  });
}
//This function returns an object for current week. Requires valid RestaurantId.
import { parse } from "node-html-parser";
function parseDayElement(day, data) {
  //Eri ruoka aikoja varten eri laatikko. Esim: lounas, aamupala, välipala, kasvislounas
  let ruoatDivs = day.querySelectorAll(".menu-item");
  let weekdayname = day.querySelector(".weekday").text;

  //tallentaa
  let foodsLiha = undefined;
  let foodsKasvis = undefined;

  ruoatDivs.forEach((div) => {
    const type = div.querySelector(".type");
    if (type.text.trim() == "Lounas") {
      //ruokien nimet, ruokaan kuuluu usein monia lisukkeita
      foodsLiha = div.querySelectorAll(".name");
    }
    if (type.text.trim() == "Kasvislounas") {
      foodsKasvis = div.querySelectorAll(".name");
    }
  });
  let kasvisruoka = "Ei kasvislounasta";
  let liharuoka = "Ei lounasta";
  //pääruoka on ensimmäisenä
  if (foodsKasvis != undefined) {
    kasvisruoka = foodsKasvis[0].text.replace("\n", " ").trim();
  }
  if (foodsLiha != undefined) {
    liharuoka = foodsLiha[0].text.replace("\n", " ").trim();
  }

  data[weekdayname] = {
    liha: liharuoka,
    kasvis: kasvisruoka,
  };
}
let cached = {};

function clearCache() {
  cached = {};
}

async function SetCWeekMenuURL(restaurantID) {
  return new Promise(async (resolve, reject) => {
    try {
      if (restaurantID in cached) {
        resolve(cached[restaurantID]);
        return;
      }
      const data = await fetch(restaurantID);
      const htmlString = await data.text();
      //content of page as dom element
      const html = parse(htmlString);
      const mydata = {};
      //finding the information from the html
      const thisweek = html.querySelector("#current-week");
      let days = thisweek.querySelectorAll(".day");
      days.forEach((day) => {
        parseDayElement(day, mydata);
      });
      resolve(mydata);
      cached[restaurantID] = mydata;
    } catch (error) {
      reject("Can't open arkea page");
      return;
    }
  });
}

// Export all functions
export { getMenu, SetCWeekMenuURL, clearCache };
