const express = require("express");
const fs = require("fs");
const app = express();
const mqtt = require("mqtt");
const clientMqtt = mqtt.connect("mqtt://host.docker.internal:1883");
const cron = require("node-cron");
const mongoose = require("mongoose");
const clientOptions = {
  dbName: "tpiotdb",
};
const CONFIG = {
  tempFreq: 2,
  connectionConfig: 1,
  connectionFreq: 20,
}
mongoose.connect(process.env.URL_MONGO, clientOptions);
const SENSOR = require("./models/sensor");
const TEMP = require("./models/temp");

const cors = require('cors');
app.use(cors({
    origin: '*'
}));

function jsonObjects(jsonString) {
  var jsonObjects = [];
  var remainingString = "";
  var depth = 0;
  var indexStart = 0;
  var indexEnd = 0;
  var pointer = 0;

  if (!jsonString.includes("{") && !jsonString.includes("}")) {
    jsonObjects.push({ pretext: jsonString, json: null });
  } else {
    for (var i = 0; i < jsonString.length; i++) {
      if (jsonString.charAt(i) === "{") {
        if (depth === 0) {
          indexStart = i;
        }
        depth++;
      } else if (jsonString.charAt(i) === "}") {
        depth--;
        if (depth === 0) {
          indexEnd = i;

          var finalJson = JSON.parse(
            jsonString.substring(indexStart, indexEnd + 1)
          );
          var gapText = jsonString.substring(pointer, indexStart);
          jsonObjects.push({ pretext: gapText, json: finalJson });

          pointer = indexEnd + 1;
          remainingString = jsonString.substring(pointer, jsonString.length);

          if (
            !remainingString.includes("{") &&
            !remainingString.includes("}")
          ) {
            jsonObjects.push({ pretext: remainingString, json: null });
          }
        }
      }
    }
  }
  return jsonObjects;
}

cron.schedule("*/20 * * * *", () => {
  // 20min
  var myHeaders = new Headers();
  myHeaders.append(
    "Authorization",
    "Bearer NNSXS.AFXIMSE6QXHFGBFXSYHMQQ6XFXJKDAOKRNFGHHI.N4WWBDZ7B7TNJA4IKJ6DGZAS6PNSRQBXZSWPFZT5ZSON52NGJW2A"
  );

  var requestOptions = {
    method: "GET",
    headers: myHeaders,
    redirect: "follow",
  };

  fetch(
    "https://eu1.cloud.thethings.network/api/v3/as/applications/soulmbengue-app-lorawansrv-1/packages/storage/uplink_message",
    requestOptions
  )
    .then((response) => response.text())
    .then((result) => {
      let jsonArray = [];
      jsonObjects(result).map(async (value) => {
        if (value.json && value.json.result.uplink_message.decoded_payload) {
          let sensor = await SENSOR.create({
            conductSoil: parseInt(
              value.json.result.uplink_message.decoded_payload.conduct_SOIL
            ),
            tempSoil: parseInt(
              value.json.result.uplink_message.decoded_payload.temp_SOIL
            ),
            waterSoil: parseInt(
              value.json.result.uplink_message.decoded_payload.water_SOIL
            ),
            receivedAt: value.json.result.received_at,
          });
        }
        console.log("Sensor creation");
      });
    })
    .catch((error) => console.log("error", error));
});

clientMqtt.on("connect", function () {
  console.log("Client connected")
  clientMqtt.subscribe("esp");
});

clientMqtt.on("message", async function (topic, message) {
  // message is Buffer
  console.log("Received Message:", topic, message.toString());
  if (topic !== "esp") {
    console.log("Save:", topic);
    let json = message.toJSON();
    console.log("JSON value:", json)
    let now = new Date()
    json = json.data.map((temp, index) => {
      return {
        data: temp,
        date: new Date(now - index * CONFIG.tempFreq * 1000 * 60 * 60),
      };
    });
    await TEMP.create({
      name: topic,
      temperatures: json
    });
  } else {
    console.log("Sub:", message.toString());
    clientMqtt.subscribe(message.toString());
  }
});

app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json(CONFIG);
});
app.put("/api/Esp32/:name", async (req, res) => {
  console.log(req.body);
  let json = req.body;
  let now = new Date()
  json = json.temperatures.map((temp, index) => {
    return {
      data: temp,
      date: new Date(now - index * CONFIG.tempFreq * 1000 * 60 * 60),
    };
  });
  await TEMP.create({
    name: req.params.name,
    temperatures: json
  });
  res.status(200);
});
app.get("/lorawan", async (req, res) => {
  let d = new Date();
  d.setDate(d.getDate() - 1);
  const sensors = await SENSOR.find({
    receivedAt: { $gte: d, $lt: new Date() },
  }).sort({ receivedAt: 1 });
  const temps = await TEMP.find({createdAt: { $gte: d, $lt: new Date() },}).sort({ createdAt: 1 })
  let data = {lorawan: sensors, temperatures: []}
  temps.forEach(temp => {
    data.temperatures.push(...temp.temperatures)
  })
  res.status(200).json(data);
});
app.listen(3000, "0.0.0.0");
