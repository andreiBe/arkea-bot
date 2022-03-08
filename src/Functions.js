import fetch from "isomorphic-fetch";
// Function to get menu. Async needed for await and ...other for extra args in future
const days = ["Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai"];

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
      color: 0x3fc77,
      timestamp: new Date(),
      footer: {
        icon_url:
          "https://pbs.twimg.com/profile_images/441542471760097280/9sDmsLIm_400x400.jpeg",
        text: "Ruokalista",
      },
      fields: list,
    },
  });
}

// This function returns correct JSON file for corresponding week. Requires valid RestaurantId. Should be used only with scheduling to avoid unnecessary resource usage.
// Async needed for await and ...other for extra args in future
import { parse } from "node-html-parser";
async function SetCWeekMenuURL(RestaurantID, ...other) {
  return new Promise(async (resolve, reject) => {
    let data = null;
    try {
      data = await fetch(
        "https://masu.arkea.fi/fi/lounaslistat?restaurant=711af04e-e0d0-4e28-9a32-cacbe8504150"
      );
    } catch (error) {
      reject("Can't open arkea page");
      return;
    }

    const htmlString = await data.text();

    const html = parse(htmlString);
    const mydata = {};
    let days = html.querySelectorAll(".day");
    days.forEach((day) => {
      let ruoatDivs = day.querySelectorAll(".menu-item");
      let weekdayname = day.querySelector(".weekday").text;

      let foodsLiha = ruoatDivs[0].querySelectorAll(".name");
      let foodsKasvis = ruoatDivs[1].querySelectorAll(".name");

      const liharuoka = foodsLiha[0].text.replace("\n", " ").trim();
      const kasvisruoka = foodsKasvis[0].text.replace("\n", " ").trim();

      console.log(liharuoka + " " + kasvisruoka + " " + weekdayname);

      mydata[weekdayname] = {
        liha: liharuoka,
        kasvis: kasvisruoka,
      };
    });
    resolve(mydata);
  });
}

const getEatingTime = (atmClass, data) => {
  if (atmClass === undefined) {
    return "Class needed";
  }
  let n = new Date().getDay() - 1;
  if (n < 0 || n >= 5) {
    return "Invalid day";
  }
  const day = days[n];
  let times = data[day];
  for (let time in times) {
    if (times[time].toLowerCase().includes(atmClass.toLowerCase())) {
      return time;
    }
  }
  return "Can't find that class for that day";
};

const toHoliday = () => {
  let date1 = new Date();
  let syysloma = new Date("2018-10-15T12:00:00+02:00");
  let joululoma = new Date("2018-12-23T12:00:00+02:00");
  let talviloma = new Date("2019-02-18T12:00:00+02:00");
  let kesaloma = new Date("2019-06-02T12:00:00+02:00");
  let timeDiff = 0;
  let diffDays = 0;
  return (loma) => {
    if (loma) {
      switch (loma) {
        case "joululoma":
          timeDiff = Math.abs(joululoma.getTime() - date1.getTime());
          diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return diffDays - 1 + " päivää joululomaan";
          break;
        case "talviloma":
          timeDiff = Math.abs(talviloma.getTime() - date1.getTime());
          diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return diffDays - 1 + " päivää talvilomaan";
          break;
        case "kesäloma":
          timeDiff = Math.abs(kesaloma.getTime() - date1.getTime());
          diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
          return diffDays - 1 + " päivää kesälomaan";
          break;
        default:
          if (syysloma.getTime() - date1.getTime() > 0) {
            timeDiff = Math.abs(syysloma.getTime() - date1.getTime());
            diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays - 1 + "päivää syyslomaan";
          } else if (joululoma.getTime() - date1.getTime() > 0) {
            timeDiff = Math.abs(joululoma.getTime() - date1.getTime());
            diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays - 1 + " päivää joululomaan";
          } else if (talviloma.getTime() - date1.getTime() > 0) {
            timeDiff = Math.abs(talviloma.getTime() - date1.getTime());
            diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays - 1 + " päivää talvilomaan";
          } else {
            timeDiff = Math.abs(kesaloma.getTime() - date1.getTime());
            diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            return diffDays - 1 + " päivää kesälomaan";
          }
      }
    } else {
      timeDiff = Math.abs(kesa.getTime() - date1.getTime());
      diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
      return diffDays - 1 + " kesälomaan";
    }
  };
};

// Export all functions
export { getMenu, SetCWeekMenuURL, getEatingTime, toHoliday };
