import express from "express";
import Code from "../models/pinModel.js";
import bcrypt from "bcrypt";
import { createAccessToken, createRefreshToken } from "./tokens.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const getPin = await Code.findOne();
    if (!getPin) {
      return res.status(404).json({ message: "No pin found" });
    }
    return res.status(200).json({ getPin });
  } catch (error) {
    res.status(500).json({ message: "Internal error", error: error.message });
  }
});

router.post("/create", async (req, res) => {
  const { pin } = req.body;
  if (!/^\d{6}$/.test(pin)) {
    return res.status(400).json({ message: "PIN must be exactly 6 digits" });
  }
  try {
    const hashPin = await bcrypt.hash(pin, 10);
    const newPin = new Code({ pin: hashPin });
    await newPin.save();
    res.status(201).json({ Message: "Pin created successfully", newPin });
  } catch (err) {
    res.status(500).json({ message: "Internal error", err: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { pin } = req.body;
  try {
    const user = await Code.findOne();
    if (!user) {
      return res.status(400).json({ Message: "User not found" });
    }
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) {
      return res.status(400).json({ Message: "Incorrect Pin" });
    }
    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);

    const { pin: _, ...safeUser } = user.toObject();
    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/api/user/refresh_token",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, safeUser });
  } catch (error) {
    res.status(500).json({ message: "Internal error", error: error.message });
  }
});

router.put("/update/:id", async (req, res) => {
  const { currentPin, confirmedPin } = req.body;
  if (!/^\d{6}$/.test(currentPin) || !/^\d{6}$/.test(confirmedPin)) {
    return res.status(400).json({ message: "PIN must be exactly 6 digits" });
  }
  try {
    const user = await Code.findOne();
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatched = await bcrypt.compare(currentPin, user.pin);
    if (!isMatched) {
      return res
        .status(401)
        .json({ message: "Your current PIN is wrong, Try again!" });
    }
    const hashedPin = await bcrypt.hash(confirmedPin, 10);
    const updatedPin = await Code.findByIdAndUpdate(req.params.id, {
      pin: hashedPin,
    });
    if (!updatedPin) {
      return res.status(404).json({ message: "Failed to update" });
    }
    res.status(200).json({ message: "Pin updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal error", error: error.message });
  }
});

router.post("/logout", (req, res) => {
  try {
    res.clearCookie("refreshToken", {
      path: "/api/user/refresh_token",
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    return res.status(200).json({ Message: "Logged out" });
  } catch (error) {
    return res.status(500).json({ Message: "Internal error", error });
  }
});

router.post("/refresh_token", async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) {
    return res.send({ accessToken: "" });
  }
  let payload = "";
  try {
    payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const user = await Code.findById(payload.id);
    if (!user || user.refreshToken !== token) {
      return res.send({ accessToken: "" });
    }
    const accessToken = createAccessToken(user);
    const refreshToken = await createRefreshToken(user);
    const { pin: _, ...safeUser } = user.toObject();
    return res
      .status(200)
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        path: "/api/user/refresh_token",
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, safeUser });
  } catch (error) {
    return res.send({ accessToken: "" });
  }
});

export default router;