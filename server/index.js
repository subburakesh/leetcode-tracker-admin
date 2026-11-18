import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import adminRouter from "./routes/adminRoute.js";


// creating the instance of the expressjs application server.
const app = express();
app.use(bodyParser.json());

// configuring the environmental variables
dotenv.config();

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