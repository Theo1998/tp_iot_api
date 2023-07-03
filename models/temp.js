const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const TempDataSchema = new Schema({
  data: { type: Number },
  date: { type: Date },
});
const TempSchema = new Schema(
  {
    name: { type: String },
    temperatures: { type: [TempDataSchema] },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("temperature", TempSchema, "temperatures");
