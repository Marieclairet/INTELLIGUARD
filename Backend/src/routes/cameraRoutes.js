import express from "express";

const cRouter = express.Router();

// In-memory only — frames are ephemeral, no need to persist them in MongoDB.
let latestFrame = null;
let lastUpdated = null;

// ESP32-CAM posts a raw JPEG binary body here every ~1-2 seconds.
// Mounted with express.raw({ type: "image/jpeg", limit: "2mb" }) in server.js
// for this route only, so it doesn't affect the JSON body parser used elsewhere.
cRouter.post("/frame", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ message: "Empty frame body" });
  }
  latestFrame = req.body;
  lastUpdated = new Date();
  res.status(201).json({ success: true });
});

// Dashboard polls this — returns the latest JPEG directly as an image.
cRouter.get("/frame", (req, res) => {
  if (!latestFrame) {
    return res.status(404).json({ message: "No frame received yet" });
  }
  res.set("Content-Type", "image/jpeg");
  res.set("Cache-Control", "no-store");
  res.send(latestFrame);
});

// Lets the dashboard show "camera online / offline" without loading the image.
cRouter.get("/status", (req, res) => {
  const online = lastUpdated && Date.now() - lastUpdated.getTime() < 10000;
  res.status(200).json({
    online: Boolean(online),
    lastUpdated,
  });
});

export default cRouter;
