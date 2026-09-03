import mongoose from "mongoose";

const countEventSchema = new mongoose.Schema({
  count: {
    type: Number,
    default: 0,
  },
  date: {
    type: String,
    default: () => new Date().toISOString().split("T")[0],
  },
});

const CountEvent = mongoose.model("CountEvent", countEventSchema);

export default CountEvent;
