import mongoose from "mongoose";

const blackboxSchema = new mongoose.Schema({
  encrypted: {
    type: String,
    required: true,
  },
  decrypted: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Blackbox = mongoose.model("Blackbox", blackboxSchema);

export default Blackbox;
