const express = require("express");
const fs = require("fs");
const app = express();
const mqtt = require("mqtt");
const client = mqtt.connect("mqtt://172.20.10.3:1883");

client.on("connect", function () {
  client.subscribe("esp", function (err) {
    if (!err) {
      client.publish("esp", "Hello mqtt");
    }
  });
});

client.on("message", function (topic, message) {
  // message is Buffer
  if (topic !== "esp") {
    if (!fs.existsSync("./" + topic + ".json")) {
      fs.appendFile("./" + topic + ".json", message.toString(), (err) => {
        if (err) {
          console.log("Error writing file", err);
        } else {
          console.log("Successfully wrote file");
        }
      });
    } else {
      fs.writeFile("./" + topic + ".json", message.toString(), (err) => {
        if (err) {
          console.log("Error writing file", err);
        } else {
          console.log("Successfully wrote file");
        }
      });
    }
  } else {
    client.publish(
      "config",
      JSON.stringify({
        tempFreq: 10,
        connectionConfig: 2,
        connectionFreq: 30,
      })
    );
    client.subscribe(message.toString());
  }
  console.log("Received Message:", topic, message.toString());
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
  if (!fs.existsSync("./" + req.params.name + ".json")) {
    fs.appendFile(
      "./" + req.params.name + ".json",
      JSON.stringify(req.body),
      (err) => {
        if (err) {
          console.log("Error writing file", err);
          res.status(400);
        } else {
          console.log("Successfully wrote file");
          let file = require("./" + req.params.name + ".json");
          res.status(200).json(file);
        }
      }
    );
  } else {
    fs.writeFile(
      "./" + req.params.name + ".json",
      JSON.stringify(req.body),
      (err) => {
        if (err) {
          console.log("Error writing file", err);
          res.status(400);
        } else {
          console.log("Successfully wrote file");
          let file = require("./" + req.params.name + ".json");
          res.status(200).json(file);
        }
      }
    );
  }
});
app.listen(3000, "0.0.0.0");
