import express from "express";
import Blackbox from "../models/blackboxModel.js";

const bRouter = express.Router();

// ESP32 pushes each queued black-box entry here once WiFi is back
bRouter.post("/", async (req, res) => {
  const { encrypted, decrypted } = req.body;

  if (!encrypted || !decrypted) {
    return res
      .status(400)
      .json({ message: "encrypted and decrypted fields are required" });
  }

  try {
    const entry = new Blackbox({ encrypted, decrypted, date: new Date() });
    await entry.save();
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

// dashboard reads the synced black-box log, most recent first
bRouter.get("/", async (req, res) => {
  try {
    const { limit } = req.query;
    const maxResults = parseInt(limit) || 500;
    const entries = await Blackbox.find()
      .sort({ date: 1 })
      .limit(maxResults);
    return res.status(200).json(entries);
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

// CLEAR button on the dashboard
bRouter.delete("/", async (req, res) => {
  try {
    await Blackbox.deleteMany({});
    return res.status(200).json({ message: "Black-box log cleared" });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

export default bRouter;
