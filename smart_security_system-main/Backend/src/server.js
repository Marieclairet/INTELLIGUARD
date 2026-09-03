import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// =====================================================
// TRUST RENDER'S PROXY
// =====================================================
app.set("trust proxy", 1);

// =====================================================
// CORS
// =====================================================
// Allow the Vercel frontend and other clients.
// We intentionally do NOT reject unknown origins.
// This removes the previous "Not allowed by CORS" problem.

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS"
    ],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization"
    ],
    optionsSuccessStatus: 204
  })
);

// CORS preflight
app.options("*", cors());

// =====================================================
// BODY PARSING
// =====================================================

app.use(
  express.json({
    limit: "10mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb"
  })
);

// =====================================================
// REQUEST LOGGER
// =====================================================

app.use((req, res, next) => {
  console.log(
    `[REQUEST] ${req.method} ${req.originalUrl} | IP: ${req.ip}`
  );

  next();
});

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "INTELLIGUARD backend is running",
    status: "online"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// API TEST
// =====================================================

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "INTELLIGUARD API is working"
  });
});

// =====================================================
// IMPORTANT
// =====================================================
// PUT YOUR EXISTING ROUTE IMPORTS HERE.
//
// DO NOT ADD A RATE LIMITER HERE.
//
// Example:
//
// import authRoutes from "./routes/authRoutes.js";
// import eventRoutes from "./routes/eventRoutes.js";
//
// app.use("/api/auth", authRoutes);
// app.use("/api/event", eventRoutes);
//
// =====================================================


// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// =====================================================
// ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log("INTELLIGUARD BACKEND ONLINE");
  console.log(`PORT: ${PORT}`);
  console.log("CORS: ENABLED");
  console.log("RATE LIMITER: NOT ENABLED");
  console.log("=================================");
});
