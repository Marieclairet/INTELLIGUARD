import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 10000;

// ===============================
// CORS
// ===============================
const allowedOrigins = [
  "https://intelliguard-seven.vercel.app",
  "https://intelliguard-1.onrender.com",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header
      // (Render health checks, Postman, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow the Vercel frontend and local development
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // TEMPORARY: allow other origins so deployment can work
      console.log("[CORS] Allowing origin:", origin);
      return callback(null, true);
    },

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization"
    ],

    credentials: true,

    optionsSuccessStatus: 204
  })
);

// Handle preflight requests
app.options("*", cors());

// ===============================
// BODY PARSING
// ===============================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===============================
// HEALTH CHECK
// ===============================
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
    status: "healthy"
  });
});

// ===============================
// YOUR ROUTES
// ===============================

// KEEP YOUR EXISTING ROUTE IMPORTS HERE.
//
// Example:
//
// import authRoutes from "./routes/authRoutes.js";
// import eventRoutes from "./routes/eventRoutes.js";
//
// app.use("/api/auth", authRoutes);
// app.use("/api/event", eventRoutes);


// ===============================
// 404 HANDLER
// ===============================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// ===============================
// ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
  console.error("[SERVER ERROR]", err);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error"
  });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`=================================`);
  console.log(`INTELLIGUARD BACKEND ONLINE`);
  console.log(`PORT: ${PORT}`);
  console.log(`=================================`);
});
