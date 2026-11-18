import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import adminRouter from "./routes/adminRoute.js";
import studentRouter from "./routes/studentRoute.js";
import dashboardRouter from "./routes/dashboardRoute.js";

// configuring the environmental variables
dotenv.config();

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
const MONGODB_URI = process.env.MONGODB_URI;

// creating the database instance and initializing the expressjs server.
const createInstance = () => {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log("Mongo DB connection was successfully initialized.");
      app.listen(PORT, () => {
        console.log(`Server is running at the port ${PORT}`);
      });
    })
    .catch((error) => console.log(error));
};

// calling the create instance function to create the database and server instance
createInstance();

app.use("/api/admin", adminRouter);
app.use("/api/auth", adminRouter);
app.use("/api/students", studentRouter);
app.use("/api/dashboard", dashboardRouter);
