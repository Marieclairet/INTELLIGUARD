import express from "express";
import Event from "../models/events.js";
import {
  countIncrementAlert,
  getCountAlert,
} from "../utiles/countEventsIncrement.js";

const eRouter = express.Router();

eRouter.post("/", async (req, res) => {
  const { message, type } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ message: "message field is required" });
  }

  const validTypes = ["ok", "warn", "danger"];
  const safeType = validTypes.includes(type) ? type : "ok";

  try {
    const event = new Event({ message: message.trim(), type: safeType, date: new Date() });
    await event.save();
    const count = await countIncrementAlert();
    res.status(201).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error });
  }
});

eRouter.get("/", async (req, res) => {
  try {
    const events = await Event.find().sort({ date: -1 }).limit(4);
    return res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error });
  }
});

// NEW — returns all events for the logs page
// supports ?type=ok|warn|danger and ?limit=100
eRouter.get("/logs", async (req, res) => {
  try {
    const { type, limit } = req.query;
    const filter = {};
    if (type && ["ok", "warn", "danger"].includes(type)) {
      filter.type = type;
    }
    const maxResults = parseInt(limit) || 200;
    const events = await Event.find(filter)
      .sort({ date: -1 })
      .limit(maxResults);
    return res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error });
  }
});

// NEW — delete all events (clear logs)
eRouter.delete("/logs", async (req, res) => {
  try {
    await Event.deleteMany({});
    return res.status(200).json({ message: "All logs cleared successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error });
  }
});

eRouter.get("/count", async (req, res) => {
  try {
    const count = await getCountAlert();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error });
  }
});

export default eRouter;