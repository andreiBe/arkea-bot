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
      color: 0x3fc77, //green
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
import { parse } from "node-html-parser";
//asettaa data muuttujaan yhden päivän tiedot. Parametrina annetaan sivuston päivää kuvaava html elementti.
function parseDayElement(day, data) {
  //Eri ruoka aikoja varten eri laatikko. Esim: lounas, aamupala, välipala, kasvislounas
  let ruoatDivs = day.querySelectorAll(".menu-item");
  let weekdayname = day.querySelector(".weekday").text;

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
// Returns the ISO week of the date. (kopioitu netistä en ole näin viisas)
Date.prototype.getWeek = function () {
  var date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    )
  );
};
//lukee arkean sivulta tiedot ja palauttaa tiedot
async function SetCWeekMenuURL(restaurantID) {
  return new Promise(async (resolve, reject) => {
    try {
      //on jo haettu, niin ei ole mitään syytä hakea uudestaan
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
      const nextweek = html.querySelector("#next-week");
      //fuck arkea
      const title1 = thisweek.querySelector(".widget-title-2");
      const curweek = new Date().getWeek();
      let days;
      if (parseInt(title1.text.split(" ")[1]) == curweek) {
        days = thisweek.querySelectorAll(".day");
      } else {
        days = nextweek.querySelectorAll(".day");
      }

      days.forEach((day) => {
        parseDayElement(day, mydata);
      });
      resolve(mydata);
      cached[restaurantID] = mydata;
    } catch (error) {
      reject("Arkean sivu rikki");
      return;
    }
  });
}

// Export all functions
export { getMenu, SetCWeekMenuURL, clearCache };
