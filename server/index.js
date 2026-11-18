import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import adminRouter from "./routes/adminRoute.js";
import studentRouter from "./routes/studentRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// configuring the environmental variables (loads from project root or local)
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// creating the instance of the expressjs application server.
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(bodyParser.json());

// importing the environmental variables
const PORT = process.env.PORT || 8080;

// Database connection helper with connection caching for serverless/local environments
let isConnected = false;
export const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MongoDB connection error: MONGODB_URI is not defined in environment variables.");
    return;
  }
  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("Mongo DB connection was successfully initialized.");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

// Middleware to ensure DB connection is ready before processing requests
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectDB();
  }
  next();
});

app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "LeetCode Tracker Admin API is running" });
});

app.use("/api/admin", adminRouter);
app.use("/api/auth", adminRouter);
app.use("/api/students", studentRouter);
app.use("/api/dashboard", dashboardRouter);

// Start server locally (when not running in Vercel serverless environment)
if (!process.env.VERCEL) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running at the port ${PORT}`);
    });
  });
}

export default app;
