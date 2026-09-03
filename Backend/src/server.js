import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { DB_connect } from "./config/db.js";
import router from "./routes/userRouters.js";
import eRouter from "./routes/eventRoutes.js";
import cors from "cors";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      const allowed = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://intelligaurd.vercel.app",
      ];
      return callback(null, allowed.includes(origin));
    },
    methods: ["POST", "GET", "PUT", "DELETE"],
    credentials: true,
  }),
);

app.use(cookieParser());

// ── RATE LIMITING ──────────────────────────────────────────
// Protects the login route from brute force attacks.
// Maximum 10 login attempts per IP address per 15 minutes.
// After 10 failed attempts the IP is blocked for 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    message:
      "Too many login attempts from this device. Please wait 15 minutes before trying again.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    console.log(
      `[RATE LIMIT] Login blocked — IP: ${req.ip} — too many attempts`,
    );
    res.status(429).json(options.message);
  },
});

// Protects the PIN change route from brute force attacks.
// Maximum 5 attempts per IP per 15 minutes.
const pinChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    message:
      "Too many PIN change attempts from this device. Please wait 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limiter — protects all other routes.
// Maximum 100 requests per IP per 15 minutes.
// ESP32 is excluded because it sends no Origin header
// and its IP is on the local network only.
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    message: "Too many requests from this device. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for ESP32 — it has no Origin header
    // and sends frequent legitimate event POSTs
    return !req.headers.origin;
  },
});

const eventPollLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // generous — covers 3s polling from several tabs/users at once
  message: {
    message: "Too many requests. Please slow down.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return !req.headers.origin; // still skip for ESP32
  },
});

app.use("/api/event", eventPollLimiter);
app.use("/api/user/login", loginLimiter);
app.use("/api/user/update", pinChangeLimiter);

// ── ROUTES ─────────────────────────────────────────────────
app.use("/api/user", router);
app.use("/api/event", eRouter);

const PORT = process.env.PORT || 4000;

DB_connect().then(() => {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at port: ${PORT}`);
    console.log(`Accepting ESP32 connections on all network interfaces`);
    console.log(`Rate limiting active — login: 10/15min, PIN change: 5/15min`);
  });
});
