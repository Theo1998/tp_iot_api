const express = require("express");
const temp = require("./temp.json");
const fs = require("fs");
const app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json(temp);
});
app.get("/api/Esp32/esp", (req, res) => {
  res.status(200).json({
    tempFreq: 10,
    connectionConfig: 3,
    connectionFreq: 30,
  });
});
app.put("/api/Esp32/esp", (req, res) => {
  console.log(req.body);
  fs.writeFile("./temp.json", JSON.stringify(req.body), (err) => {
    if (err) {
      console.log("Error writing file", err);
    } else {
      console.log("Successfully wrote file");
    }
  });
  res.status(200).json(temp);
});
app.listen(8080, "0.0.0.0");
