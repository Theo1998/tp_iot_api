const express = require("express");
const fs = require("fs");
const app = express();
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://172.20.10.3:1883");

client.on("connect", function () {
  client.subscribe("esp");
});

client.on("message", function (topic, message) {
  // message is Buffer
  console.log("Received Message:", topic, message.toString());
  if (topic !== "esp") {
    console.log("Save:", topic);
    let json = message.toJSON();
    json.data.temperatures.map((temp) => {
      return {
        data: temp,
        date: new Date().getUTCDate(),
      };
    });
    if (!fs.existsSync("./temp/" + topic + ".json")) {
      fs.appendFile(
        "./temp/" + topic + ".json",
        JSON.stringify(json),
        (err) => {
          if (err) {
            console.log("Error writing file", err);
          } else {
            console.log("Successfully wrote file");
          }
        }
      );
    } else {
      fs.writeFile("./temp/" + topic + ".json", JSON.stringify(json), (err) => {
        if (err) {
          console.log("Error writing file", err);
        } else {
          console.log("Successfully wrote file");
        }
      });
    }
    fs.readdir("./temp", (err, files) => {
      if (!err) {
        let temperatures = [];
        files.forEach((file) => {
          fs.readFile(file, (err, data) => {
            if (!err) {
              let jsonData = JSON.parse(data.toString());
              temperatures.push(...jsonData.temperatures);
            }
          });
        });
        console.log("Pub: ", "temperatures");
        client.publish(
          "temperatures",
          JSON.stringify({
            temperatures,
          })
        );
      }
    });
  } else {
    console.log("Sub:", message.toString());
    client.subscribe(message.toString());
  }
});

app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    tempFreq: 10,
    connectionConfig: 2,
    connectionFreq: 30,
  });
});
app.put("/api/Esp32/:name", (req, res) => {
  console.log(req.body);
  let json = req.body;
  json.data.temperatures.map((temp) => {
    return {
      data: temp,
      date: new Date().getUTCDate(),
    };
  });
  if (!fs.existsSync("./temp/" + req.params.name + ".json")) {
    fs.appendFile(
      "./temp/" + req.params.name + ".json",
      JSON.stringify(json),
      (err) => {
        if (err) {
          console.log("Error writing file", err);
          res.status(400);
        } else {
          console.log("Successfully wrote file");
          let file = require("./temp/" + req.params.name + ".json");
          res.status(200).json(file);
        }
      }
    );
  } else {
    fs.writeFile(
      "./temp/" + req.params.name + ".json",
      JSON.stringify(json),
      (err) => {
        if (err) {
          console.log("Error writing file", err);
          res.status(400);
        } else {
          console.log("Successfully wrote file");
          let file = require("./temp/" + req.params.name + ".json");
          res.status(200).json(file);
        }
      }
    );
  }
});
app.listen(3000, "0.0.0.0");
