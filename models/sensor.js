const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const SensorSchema = new Schema(
  {
    conductSoil:{ type: Number },
    tempSoil:{ type: Number },
    waterSoil:{ type: Number },
    receivedAt: { type: Date }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("sensor", SensorSchema, "sensors");
