import express from "express";
import CameraSnapshot from "../models/cameraSnapshotModel.js";

const cRouter = express.Router();

// In-memory only — the LIVE frame is ephemeral, no need to persist every
// single one in MongoDB. Snapshots (below) are the permanent history.
let latestFrame = null;
let lastUpdated = null;

// ESP32-CAM posts a raw JPEG binary body here every ~1-2 seconds for the
// live view. Mounted with express.raw({ type: "image/jpeg" }) in server.js.
cRouter.post("/frame", (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ message: "Empty frame body" });
  }
  latestFrame = req.body;
  lastUpdated = new Date();
  res.status(201).json({ success: true });
});

// Dashboard polls this for the live view.
cRouter.get("/frame", (req, res) => {
  if (!latestFrame) {
    return res.status(404).json({ message: "No frame received yet" });
  }
  res.set("Content-Type", "image/jpeg");
  res.set("Cache-Control", "no-store");
  res.send(latestFrame);
});

cRouter.get("/status", (req, res) => {
  const online = lastUpdated && Date.now() - lastUpdated.getTime() < 10000;
  res.status(200).json({
    online: Boolean(online),
    lastUpdated,
  });
});

// ── PERMANENT SNAPSHOT HISTORY (MongoDB) ──────────────────────
// ESP32-CAM posts here far less often (every ~30s) so the database
// doesn't fill up. This is what powers a "camera history" gallery.
cRouter.post("/snapshot", async (req, res) => {
  if (!req.body || req.body.length === 0) {
    return res.status(400).json({ message: "Empty snapshot body" });
  }
  try {
    const snap = new CameraSnapshot({ image: req.body, date: new Date() });
    await snap.save();
    res.status(201).json({ success: true, id: snap._id });
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

// List snapshot metadata (excludes the image binary — keeps this fast)
cRouter.get("/snapshots", async (req, res) => {
  try {
    const { limit } = req.query;
    const maxResults = parseInt(limit) || 50;
    const snaps = await CameraSnapshot.find()
      .select("-image")
      .sort({ date: -1 })
      .limit(maxResults);
    res.status(200).json(snaps);
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

// Fetch one snapshot's actual image
cRouter.get("/snapshot/:id", async (req, res) => {
  try {
    const snap = await CameraSnapshot.findById(req.params.id);
    if (!snap) return res.status(404).json({ message: "Not found" });
    res.set("Content-Type", snap.contentType || "image/jpeg");
    res.send(snap.image);
  } catch (error) {
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

export default cRouter;
